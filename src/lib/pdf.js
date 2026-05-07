import {PDFDocument} from 'pdf-lib';

// Canonical user-facing error messages for PDF parsing failures.
// Used by pdf-merger and pdf-splitter. Centralised here so both tools
// show consistent text and the test suite only needs one set of assertions.
export const ERR_ENCRYPTED =
  'Password-protected PDFs are not supported. Decrypt this file first and try again.';
export const ERR_CORRUPT =
  'Could not read this file. It may be corrupt or not a valid PDF.';

// PDF MIME type used for file-type gating.
export const PDF_MIME = 'application/pdf';

/**
 * Return true if `file` is (or looks like) a PDF.
 *
 * We check `file.type` first and fall back to the file extension for
 * browsers / OS file managers that leave `type` empty on drop.
 *
 * @param {File} file
 * @returns {boolean}
 */
export function isPdfFile(file) {
  if (!file) return false;
  if (file.type === PDF_MIME) return true;
  if (!file.type) {
    const name = (file.name || '').toLowerCase();
    return name.endsWith('.pdf');
  }
  return false;
}

/**
 * Parse a PDF ArrayBuffer to extract its page count, surfacing an
 * encryption / corruption flag instead of letting pdf-lib throw raw.
 *
 * The boundary is deliberately narrow — callers pass a buffer, get back
 * a page count or a structured error. The PDF library itself doesn't
 * touch the DOM, so this helper is environment-agnostic.
 *
 * @param {ArrayBuffer} arrayBuffer
 * @returns {Promise<{pageCount: number} | {error: 'encrypted' | 'corrupt', message: string}>}
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
