import {describe, it, expect, vi, beforeEach} from 'vitest';

// Mock pdf-lib at the module level. We never load real PDFs in jsdom — the
// test verifies call-shape (PDFDocument.create, .load, copyPages, addPage,
// save) which is what the spec requires.
vi.mock('pdf-lib', () => {
  const addPage = vi.fn();
  const copyPages = vi.fn();
  const save = vi.fn();
  const getPageCount = vi.fn();
  const create = vi.fn();
  const load = vi.fn();

  return {
    PDFDocument: {
      create,
      load,
      // Expose hooks for assertions (the test file reaches in via the import).
      __addPage: addPage,
      __copyPages: copyPages,
      __save: save,
      __getPageCount: getPageCount,
    },
  };
});

import {PDFDocument} from 'pdf-lib';
import {mergePdfs, parsePdfMetadata} from './pipeline';

beforeEach(() => {
  vi.clearAllMocks();
  PDFDocument.__addPage.mockReset();
  PDFDocument.__copyPages.mockReset();
  PDFDocument.__save.mockReset();
  PDFDocument.__getPageCount.mockReset();
  PDFDocument.create.mockReset();
  PDFDocument.load.mockReset();
});

describe('parsePdfMetadata', () => {
  it('returns the page count when load succeeds', async () => {
    PDFDocument.load.mockResolvedValueOnce({
      getPageCount: () => 7,
    });
    const buf = new ArrayBuffer(8);
    const result = await parsePdfMetadata(buf);
    expect(result).toEqual({pageCount: 7});
    expect(PDFDocument.load).toHaveBeenCalledWith(buf, {ignoreEncryption: false});
  });

  it('returns an "encrypted" error when pdf-lib reports encryption', async () => {
    PDFDocument.load.mockRejectedValueOnce(
      new Error('Input document is encrypted')
    );
    const result = await parsePdfMetadata(new ArrayBuffer(8));
    expect(result.error).toBe('encrypted');
    expect(result.message).toMatch(/password-protected/i);
  });

  it('returns a "corrupt" error for any other failure', async () => {
    PDFDocument.load.mockRejectedValueOnce(new Error('Failed to parse PDF'));
    const result = await parsePdfMetadata(new ArrayBuffer(8));
    expect(result.error).toBe('corrupt');
    expect(result.message).toMatch(/could not read/i);
  });
});

describe('mergePdfs', () => {
  it('throws when given an empty file list', async () => {
    await expect(mergePdfs([], [])).rejects.toThrow(/no files/i);
  });

  it('throws when selections length does not match files length', async () => {
    await expect(mergePdfs([{arrayBuffer: new ArrayBuffer(1)}], [])).rejects.toThrow(
      /selections/i
    );
  });

  it('creates a target doc, loads each source, copies the selected pages, addPages, and saves a Blob', async () => {
    // Set up the merged target doc returned by create().
    const addPage = vi.fn();
    const copyPages = vi.fn();
    const save = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]));

    const targetDoc = {addPage, copyPages, save};
    PDFDocument.create.mockResolvedValueOnce(targetDoc);

    // Each source doc returned by load — sentinel objects so we can assert
    // copyPages was called with the right source.
    const srcA = {__name: 'A'};
    const srcB = {__name: 'B'};
    PDFDocument.load.mockResolvedValueOnce(srcA);
    PDFDocument.load.mockResolvedValueOnce(srcB);

    // copyPages returns one fake page per index. Use distinct refs so we can
    // assert addPage was called with the right ones in order.
    copyPages.mockImplementation((src, indices) =>
      Promise.resolve(indices.map((i) => ({__src: src.__name, __i: i})))
    );

    const bufA = new ArrayBuffer(8);
    const bufB = new ArrayBuffer(16);

    const blob = await mergePdfs(
      [{arrayBuffer: bufA}, {arrayBuffer: bufB}],
      [{indices: [0, 2]}, {indices: [1]}]
    );

    expect(PDFDocument.create).toHaveBeenCalledTimes(1);
    expect(PDFDocument.load).toHaveBeenNthCalledWith(1, bufA);
    expect(PDFDocument.load).toHaveBeenNthCalledWith(2, bufB);

    expect(copyPages).toHaveBeenNthCalledWith(1, srcA, [0, 2]);
    expect(copyPages).toHaveBeenNthCalledWith(2, srcB, [1]);

    // addPage called once per copied page, in order.
    expect(addPage).toHaveBeenCalledTimes(3);
    expect(addPage).toHaveBeenNthCalledWith(1, {__src: 'A', __i: 0});
    expect(addPage).toHaveBeenNthCalledWith(2, {__src: 'A', __i: 2});
    expect(addPage).toHaveBeenNthCalledWith(3, {__src: 'B', __i: 1});

    expect(save).toHaveBeenCalledTimes(1);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/pdf');
  });
});
