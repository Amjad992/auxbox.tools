// PDF Splitter — pdf-lib pipeline (parse metadata + extract pages).

import {PDFDocument} from 'pdf-lib';
import {ERR_CORRUPT, ERR_ENCRYPTED} from './constants';

/**
 * Parse a PDF ArrayBuffer to extract its page count, surfacing an
 * encryption / corruption flag instead of letting pdf-lib throw raw.
 *
 * Identical shape to pdf-merger's helper; if a third tool starts using
 * this, lift to `src/lib/pdf.js`.
 */
export async function parsePdfMetadata(arrayBuffer) {
  try {
    const doc = await PDFDocument.load(arrayBuffer, {ignoreEncryption: false});
    return {pageCount: doc.getPageCount()};
  } catch (err) {
    const msg = (err && err.message) || '';
    if (err?.name === 'EncryptedPDFError' || /encrypt/i.test(msg)) {
      return {error: 'encrypted', message: ERR_ENCRYPTED};
    }
    return {error: 'corrupt', message: ERR_CORRUPT};
  }
}

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
  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, indices);
  for (const p of copied) out.addPage(p);
  const bytes = await out.save();
  return new Blob([bytes], {type: 'application/pdf'});
}
