import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {renderHook, act, waitFor} from '@testing-library/react';
import {useImageCompressor} from './hooks';

// Mock the pipeline module so tests don't touch createImageBitmap / canvas.
vi.mock('./pipeline');
import {compressImage} from './pipeline';

// jsdom doesn't implement URL.createObjectURL / revokeObjectURL; define them.
const mockUrl = 'blob:test-url';
if (!URL.createObjectURL) {
  URL.createObjectURL = () => mockUrl;
}
if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = () => undefined;
}

// Default successful compress result used by most tests.
const defaultResult = {
  blob: new Blob(['x'], {type: 'image/jpeg'}),
  width: 800,
  height: 600,
  mimeType: 'image/jpeg',
};

beforeEach(() => {
  // Reset the module mock and URL stubs before every test.
  compressImage.mockReset();
  vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockUrl);
  vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function makeFile(name = 'photo.jpg', type = 'image/jpeg') {
  return new File(['data'], name, {type});
}

describe('useImageCompressor', () => {
  describe('queued → encoding → done (happy path)', () => {
    it('transitions a file to done and sets outputUrl', async () => {
      compressImage.mockResolvedValue(defaultResult);

      const {result} = renderHook(() => useImageCompressor());

      act(() => {
        result.current.addFiles([makeFile()]);
      });

      await waitFor(
        () => expect(result.current.items[0].status).toBe('done'),
        {timeout: 2000}
      );

      expect(result.current.items[0].outputUrl).toBe(mockUrl);
      expect(result.current.items[0].outputSize).toBe(defaultResult.blob.size);
      expect(result.current.items[0].outputWidth).toBe(800);
      expect(result.current.items[0].outputHeight).toBe(600);
      expect(URL.createObjectURL).toHaveBeenCalledWith(defaultResult.blob);
    });
  });

  describe('queued → encoding → error path', () => {
    it('transitions a file to error and sets error message', async () => {
      compressImage.mockRejectedValue(new Error('Canvas encoding failed'));

      const {result} = renderHook(() => useImageCompressor());

      act(() => {
        result.current.addFiles([makeFile()]);
      });

      await waitFor(
        () => expect(result.current.items[0].status).toBe('error'),
        {timeout: 2000}
      );

      expect(result.current.items[0].error).toBe('Canvas encoding failed');
    });
  });

  describe('removeItem revokes outputUrl', () => {
    it('calls URL.revokeObjectURL with the row url when item is removed', async () => {
      compressImage.mockResolvedValue(defaultResult);

      const {result} = renderHook(() => useImageCompressor());

      act(() => {
        result.current.addFiles([makeFile()]);
      });

      await waitFor(
        () => expect(result.current.items[0].status).toBe('done'),
        {timeout: 2000}
      );

      const id = result.current.items[0].id;

      act(() => {
        result.current.removeItem(id);
      });

      expect(URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);
      expect(result.current.items).toHaveLength(0);
    });
  });

  describe('options change requeues done items but leaves error items alone', () => {
    it('requeues done items when quality changes', async () => {
      compressImage.mockResolvedValue(defaultResult);

      const {result} = renderHook(() => useImageCompressor());

      act(() => {
        result.current.addFiles([makeFile()]);
      });

      // Wait for first encode to finish.
      await waitFor(
        () => expect(result.current.items[0].status).toBe('done'),
        {timeout: 2000}
      );

      // Clear call count before triggering reencode so we can count this test's calls.
      compressImage.mockClear();

      // Change quality to trigger reencode.
      act(() => {
        result.current.setQuality(0.5);
      });

      // Item should be requeued (briefly) then go done again.
      await waitFor(
        () => expect(result.current.items[0].status).toBe('done'),
        {timeout: 3000}
      );

      // Only the reencode call should have been made (not the initial one).
      expect(compressImage).toHaveBeenCalledTimes(1);
    });

    it('does not reencode error items when options change', async () => {
      // First file errors; subsequent calls would resolve (if requeue happened).
      compressImage.mockRejectedValueOnce(new Error('fail'));
      // If the item were incorrectly requeued, compressImage would resolve and
      // the status would become 'done'. We assert it stays 'error'.
      compressImage.mockResolvedValue(defaultResult);

      const {result} = renderHook(() => useImageCompressor());

      act(() => {
        result.current.addFiles([makeFile()]);
      });

      await waitFor(
        () => expect(result.current.items[0].status).toBe('error'),
        {timeout: 2000}
      );

      // Change quality — should NOT reencode the error item.
      act(() => {
        result.current.setQuality(0.5);
      });

      // Wait a bit for any undesired reencode to fire, then assert still error.
      // Use waitFor with a short interval rather than a raw setTimeout so the
      // assertion runs inside RTL's flush cycle.
      await waitFor(
        () => expect(result.current.items[0].status).toBe('error'),
        {timeout: 1000, interval: 50}
      );
    });
  });

  describe('Issue 4: row stability — output fields preserved during re-encode', () => {
    it('preserves outputUrl and outputBlob on the row while re-encoding (no layout jump)', async () => {
      compressImage.mockResolvedValue(defaultResult);

      const {result} = renderHook(() => useImageCompressor());

      act(() => {
        result.current.addFiles([makeFile()]);
      });

      // Wait for first encode to complete.
      await waitFor(
        () => expect(result.current.items[0].status).toBe('done'),
        {timeout: 2000}
      );

      const firstUrl = result.current.items[0].outputUrl;
      expect(firstUrl).toBe(mockUrl);

      // Trigger a re-encode by changing quality.
      act(() => {
        result.current.setQuality(0.5);
      });

      // After setQuality, React flushes effects synchronously in RTL, so the item
      // may be at 'queued' or already at 'encoding' by the time we read it.
      // The critical invariant is that outputUrl/outputBlob remain on the item
      // during the entire re-encode cycle (no layout jump).
      const itemDuringReencode = result.current.items[0];
      expect(['queued', 'encoding']).toContain(itemDuringReencode.status);
      // The stale outputUrl/outputBlob must still be on the item.
      expect(itemDuringReencode.outputUrl).toBeTruthy();
      expect(itemDuringReencode.outputBlob).not.toBeNull();

      // Wait for re-encode to complete.
      await waitFor(
        () => expect(result.current.items[0].status).toBe('done'),
        {timeout: 3000}
      );

      // After re-encode, the item still has an outputUrl.
      expect(result.current.items[0].outputUrl).toBeTruthy();
    });

    it('stores originalWidth and originalHeight from the first encode', async () => {
      const resultWithSrc = {
        ...defaultResult,
        srcWidth: 1920,
        srcHeight: 1080,
      };
      compressImage.mockResolvedValue(resultWithSrc);

      const {result} = renderHook(() => useImageCompressor());

      act(() => {
        result.current.addFiles([makeFile()]);
      });

      await waitFor(
        () => expect(result.current.items[0].status).toBe('done'),
        {timeout: 2000}
      );

      expect(result.current.items[0].originalWidth).toBe(1920);
      expect(result.current.items[0].originalHeight).toBe(1080);
    });

    it('exposes largestOriginalWidth / largestOriginalHeight from the hook', async () => {
      const resultWithSrc = {
        ...defaultResult,
        srcWidth: 3840,
        srcHeight: 2160,
      };
      compressImage.mockResolvedValue(resultWithSrc);

      const {result} = renderHook(() => useImageCompressor());

      act(() => {
        result.current.addFiles([makeFile()]);
      });

      await waitFor(
        () => expect(result.current.items[0].status).toBe('done'),
        {timeout: 2000}
      );

      expect(result.current.largestOriginalWidth).toBe(3840);
      expect(result.current.largestOriginalHeight).toBe(2160);
    });
  });

});
