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

  it('throws when no pages are given', async () => {
    const buf = await makePdfBuffer(3);
    await expect(extractPages(buf, [])).rejects.toThrow(/no pages/i);
  });

  it('throws when input is not a valid PDF', async () => {
    const garbage = new TextEncoder().encode('not a pdf').buffer;
    await expect(extractPages(garbage, [0])).rejects.toThrow();
  });
});
