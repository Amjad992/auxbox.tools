// @vitest-environment node
// Pipeline tests use real pdf-lib and need Blob.prototype.arrayBuffer(),
// which is not implemented in jsdom. Node environment provides it natively.
import {describe, it, expect} from 'vitest';
import {PDFDocument} from 'pdf-lib';
import {extractPages, parsePdfMetadata} from './pipeline';

async function makePdfBuffer(pageCount = 5) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    doc.addPage([200, 200]);
  }
  return await doc.save();
}

describe('parsePdfMetadata', () => {
  it('returns the page count for a valid PDF', async () => {
    const buf = await makePdfBuffer(7);
    const r = await parsePdfMetadata(buf);
    expect(r.pageCount).toBe(7);
  });

  it('parses a single-page PDF', async () => {
    const buf = await makePdfBuffer(1);
    const r = await parsePdfMetadata(buf);
    expect(r.pageCount).toBe(1);
  });

  it('returns a structured error for non-PDF bytes', async () => {
    const buf = new TextEncoder().encode('not a pdf').buffer;
    const r = await parsePdfMetadata(buf);
    expect(r.error).toBe('corrupt');
    expect(typeof r.message).toBe('string');
  });
});

describe('extractPages', () => {
  it('returns a Blob with application/pdf type', async () => {
    const buf = await makePdfBuffer(5);
    const blob = await extractPages(buf, [0, 2, 4]);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(0);
  });

  it('round-trips: extracted PDF has the correct page count', async () => {
    const buf = await makePdfBuffer(5);
    const blob = await extractPages(buf, [0, 2, 4]);
    // Verify the output PDF actually contains the right number of pages.
    // Blob.prototype.arrayBuffer() is available natively in Node (see file-level
    // @vitest-environment node annotation — jsdom does not implement it).
    const outBuf = await blob.arrayBuffer();
    const outDoc = await PDFDocument.load(outBuf);
    expect(outDoc.getPageCount()).toBe(3);
  });

  it('throws when no pages are given', async () => {
    const buf = await makePdfBuffer(3);
    await expect(extractPages(buf, [])).rejects.toThrow(/no pages/i);
  });

  it('throws when input is not a valid PDF', async () => {
    const garbage = new TextEncoder().encode('not a pdf').buffer;
    await expect(extractPages(garbage, [0])).rejects.toThrow();
  });

  it('throws when an index is out of range (S6)', async () => {
    const buf = await makePdfBuffer(3);
    // Index 5 does not exist in a 3-page PDF (valid range: 0-2).
    await expect(extractPages(buf, [0, 5])).rejects.toThrow(/out of range/i);
  });
});
