import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {act, renderHook, waitFor} from '@testing-library/react';

// Mock the pipeline so we never touch real pdf-lib in jsdom.
vi.mock('./pipeline', () => ({
  parsePdfMetadata: vi.fn(),
  mergePdfs: vi.fn(),
}));

import {parsePdfMetadata, mergePdfs} from './pipeline';
import {usePdfMerger} from './hooks';

// jsdom doesn't implement URL.createObjectURL / revokeObjectURL.
// Provide stubs so the hook's URL lifecycle code can run.
if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = vi.fn(() => 'blob:mock-url');
}
if (typeof URL.revokeObjectURL !== 'function') {
  URL.revokeObjectURL = vi.fn();
}

// Also stub document.body.appendChild / removeChild so downloadBlob anchor
// manipulation doesn't throw in jsdom.
const _appendChild = document.body.appendChild.bind(document.body);
const _removeChild = document.body.removeChild.bind(document.body);

function makePdf(name = 'doc.pdf', size = 1024) {
  const buf = new Uint8Array(size);
  const file = new File([buf], name, {type: 'application/pdf'});
  // jsdom's File polyfill is partial; ensure arrayBuffer() resolves to the
  // backing buffer for the parse step.
  if (typeof file.arrayBuffer !== 'function') {
    file.arrayBuffer = () => Promise.resolve(buf.buffer);
  }
  return file;
}

beforeEach(() => {
  parsePdfMetadata.mockReset();
  mergePdfs.mockReset();
  // Default: parse always succeeds with 5 pages.
  parsePdfMetadata.mockResolvedValue({pageCount: 5});
  // Reset URL stubs between tests.
  URL.createObjectURL.mockClear?.();
  URL.revokeObjectURL.mockClear?.();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('usePdfMerger', () => {
  it('starts with empty state', () => {
    const {result} = renderHook(() => usePdfMerger());
    expect(result.current.files).toEqual([]);
    expect(result.current.rejections).toEqual([]);
    expect(result.current.canMerge).toBe(false);
    expect(result.current.mergeStatus).toBe('idle');
  });

  it('addFiles validates and parses each file (status parsing -> ready)', async () => {
    const {result} = renderHook(() => usePdfMerger());

    await act(async () => {
      result.current.addFiles([makePdf('a.pdf'), makePdf('b.pdf')]);
    });

    // Wait for parse to settle.
    await waitFor(() => {
      expect(result.current.files).toHaveLength(2);
      expect(result.current.files.every((f) => f.status === 'ready')).toBe(true);
    });
    expect(result.current.files[0].pageCount).toBe(5);
    expect(parsePdfMetadata).toHaveBeenCalledTimes(2);
  });

  it('rejects oversized + non-PDF; surfaces them in rejections', async () => {
    const {result} = renderHook(() => usePdfMerger());
    const big = makePdf('big.pdf', 50 * 1024 * 1024 + 1);
    const png = new File([new Uint8Array(10)], 'pic.png', {type: 'image/png'});
    const ok = makePdf('ok.pdf');

    await act(async () => {
      result.current.addFiles([big, png, ok]);
    });

    await waitFor(() => {
      expect(result.current.files).toHaveLength(1);
      expect(result.current.files[0].name).toBe('ok.pdf');
    });
    expect(result.current.rejections).toHaveLength(2);
  });

  it('marks files with status error when parsePdfMetadata reports encrypted', async () => {
    parsePdfMetadata.mockResolvedValueOnce({error: 'encrypted', message: 'enc'});
    const {result} = renderHook(() => usePdfMerger());
    await act(async () => {
      result.current.addFiles([makePdf('e.pdf')]);
    });
    await waitFor(() => {
      expect(result.current.files[0].status).toBe('error');
    });
    expect(result.current.files[0].parseError).toBe('encrypted');
  });

  it('removeFile drops the targeted row', async () => {
    const {result} = renderHook(() => usePdfMerger());
    await act(async () => {
      result.current.addFiles([makePdf('a.pdf'), makePdf('b.pdf')]);
    });
    await waitFor(() => expect(result.current.files).toHaveLength(2));

    const idToRemove = result.current.files[0].id;
    act(() => result.current.removeFile(idToRemove));
    expect(result.current.files).toHaveLength(1);
    expect(result.current.files[0].name).toBe('b.pdf');
  });

  it('moveFile reorders the list', async () => {
    const {result} = renderHook(() => usePdfMerger());
    await act(async () => {
      result.current.addFiles([makePdf('a.pdf'), makePdf('b.pdf'), makePdf('c.pdf')]);
    });
    await waitFor(() => expect(result.current.files).toHaveLength(3));

    act(() => result.current.moveFile(0, 2));
    expect(result.current.files.map((f) => f.name)).toEqual([
      'b.pdf',
      'c.pdf',
      'a.pdf',
    ]);
  });

  it('setPageRange updates only the targeted row', async () => {
    const {result} = renderHook(() => usePdfMerger());
    await act(async () => {
      result.current.addFiles([makePdf('a.pdf'), makePdf('b.pdf')]);
    });
    await waitFor(() => expect(result.current.files).toHaveLength(2));

    act(() => result.current.setPageRange(result.current.files[0].id, '1-2'));
    expect(result.current.files[0].pageRange).toBe('1-2');
    expect(result.current.files[1].pageRange).toBe('');
  });

  it('canMerge is false until at least 2 files are ready', async () => {
    const {result} = renderHook(() => usePdfMerger());
    await act(async () => {
      result.current.addFiles([makePdf('a.pdf')]);
    });
    await waitFor(() => expect(result.current.files[0].status).toBe('ready'));
    expect(result.current.canMerge).toBe(false);

    await act(async () => {
      result.current.addFiles([makePdf('b.pdf')]);
    });
    await waitFor(() => expect(result.current.files).toHaveLength(2));
    await waitFor(() =>
      expect(result.current.files.every((f) => f.status === 'ready')).toBe(true)
    );
    expect(result.current.canMerge).toBe(true);
  });

  it('canMerge is false when any file has a parse error', async () => {
    parsePdfMetadata
      .mockResolvedValueOnce({pageCount: 3})
      .mockResolvedValueOnce({error: 'corrupt', message: 'corrupt'});
    const {result} = renderHook(() => usePdfMerger());
    await act(async () => {
      result.current.addFiles([makePdf('a.pdf'), makePdf('b.pdf')]);
    });
    await waitFor(() => expect(result.current.files).toHaveLength(2));
    await waitFor(() =>
      expect(result.current.files[1].status).toBe('error')
    );
    expect(result.current.canMerge).toBe(false);
  });

  it('canMerge is false when a page-range is invalid', async () => {
    const {result} = renderHook(() => usePdfMerger());
    await act(async () => {
      result.current.addFiles([makePdf('a.pdf'), makePdf('b.pdf')]);
    });
    await waitFor(() =>
      expect(result.current.files.every((f) => f.status === 'ready')).toBe(true)
    );
    act(() => result.current.setPageRange(result.current.files[0].id, '99'));
    expect(result.current.canMerge).toBe(false);
    expect(result.current.fileRangeErrors[0]).toMatch(/exceeds/);
  });

  it('merge happy path: calls mergePdfs with arrayBuffers + indices, triggers download', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = vi.fn();

    const {result} = renderHook(() => usePdfMerger());
    await act(async () => {
      result.current.addFiles([makePdf('a.pdf'), makePdf('b.pdf')]);
    });
    await waitFor(() =>
      expect(result.current.files.every((f) => f.status === 'ready')).toBe(true)
    );

    const fakeBlob = new Blob(['x'], {type: 'application/pdf'});
    mergePdfs.mockResolvedValueOnce(fakeBlob);

    await act(async () => {
      await result.current.merge();
    });

    expect(mergePdfs).toHaveBeenCalledTimes(1);
    const [parsedFiles, selections] = mergePdfs.mock.calls[0];
    expect(parsedFiles).toHaveLength(2);
    expect(parsedFiles[0]).toHaveProperty('arrayBuffer');
    expect(selections[0].indices).toEqual([0, 1, 2, 3, 4]); // empty range = all 5

    // Hook creates an object URL for the download.
    expect(URL.createObjectURL).toHaveBeenCalledWith(fakeBlob);
    expect(result.current.mergeStatus).toBe('success');
    // mergedCount captures the snapshot length.
    expect(result.current.mergedCount).toBe(2);
  });

  it('merge error path: surfaces mergeError and sets status', async () => {
    const {result} = renderHook(() => usePdfMerger());
    await act(async () => {
      result.current.addFiles([makePdf('a.pdf'), makePdf('b.pdf')]);
    });
    await waitFor(() =>
      expect(result.current.files.every((f) => f.status === 'ready')).toBe(true)
    );

    mergePdfs.mockRejectedValueOnce(new Error('pdf-lib boom'));
    await act(async () => {
      await result.current.merge();
    });
    expect(result.current.mergeStatus).toBe('error');
    expect(result.current.mergeError).toMatch(/pdf-lib boom/);
  });

  it('clearAll resets all state slices after a failed merge (MIN-10)', async () => {
    const {result} = renderHook(() => usePdfMerger());
    await act(async () => {
      result.current.addFiles([makePdf('a.pdf'), makePdf('b.pdf')]);
    });
    await waitFor(() =>
      expect(result.current.files.every((f) => f.status === 'ready')).toBe(true)
    );

    // Trigger a failing merge.
    mergePdfs.mockRejectedValueOnce(new Error('boom'));
    await act(async () => {
      await result.current.merge();
    });
    expect(result.current.mergeStatus).toBe('error');
    expect(result.current.mergeError).toBeTruthy();

    // clearAll must reset all four state slices.
    act(() => result.current.clearAll());
    expect(result.current.files).toEqual([]);
    expect(result.current.rejections).toEqual([]);
    expect(result.current.mergeStatus).toBe('idle');
    expect(result.current.mergeError).toBeNull();
  });
});
