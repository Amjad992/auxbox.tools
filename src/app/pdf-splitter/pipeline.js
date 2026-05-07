// PDF Splitter — pdf-lib pipeline (parse metadata + extract pages).

import {PDFDocument} from 'pdf-lib';

// parsePdfMetadata is canonical in src/lib/pdf.js.
// Re-exported here for any imports inside pdf-splitter that reference './pipeline'.
// TODO: move pdf-lib work to a Web Worker to avoid freezing the main thread on large files.
export {parsePdfMetadata} from '../../lib/pdf';

/**
 * Extract `indices` from `arrayBuffer` and return a single PDF Blob
 * containing those pages in the order requested.
 *
 * @param {ArrayBuffer} arrayBuffer
 * @param {number[]} indices    0-based page indices, in output order
 * @returns {Promise<Blob>}
 */
export async function extractPages(arrayBuffer, indices) {
  if (!Array.isArray(indices) || indices.length === 0) {
    throw new Error('No pages to extract.');
  }
  const src = await PDFDocument.load(arrayBuffer, {ignoreEncryption: false});
  const pageCount = src.getPageCount();
  const outOfRange = indices.filter((i) => i < 0 || i >= pageCount);
  if (outOfRange.length > 0) {
    throw new Error(
      `Page index ${outOfRange[0]} is out of range (document has ${pageCount} page${pageCount === 1 ? '' : 's'}).`
    );
  }
  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, indices);
  for (const p of copied) out.addPage(p);
  const bytes = await out.save();
  return new Blob([bytes], {type: 'application/pdf'});
}
