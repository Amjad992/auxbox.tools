import {PDFDocument} from 'pdf-lib';

import {ERR_CORRUPT, ERR_ENCRYPTED} from './constants';

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

/**
 * Merge a list of pre-loaded PDF buffers into a single PDF Blob.
 *
 * @param {Array<{arrayBuffer: ArrayBuffer}>} parsedFiles  in user-chosen order
 * @param {Array<{indices: number[]}>} selections          0-based page indices per file
 * @returns {Promise<Blob>} application/pdf blob, ready to download
 *
 * Errors from pdf-lib propagate as thrown Errors with whatever message
 * the library provided; the caller (the hook) wraps them in a friendly
 * surface via try/catch.
 */
export async function mergePdfs(parsedFiles, selections) {
  if (!Array.isArray(parsedFiles) || parsedFiles.length === 0) {
    throw new Error('No files to merge.');
  }
  if (!Array.isArray(selections) || selections.length !== parsedFiles.length) {
    throw new Error('Page selections do not match the file list.');
  }

  const merged = await PDFDocument.create();
  for (let i = 0; i < parsedFiles.length; i++) {
    const src = await PDFDocument.load(parsedFiles[i].arrayBuffer, {ignoreEncryption: false});
    const indices = selections[i].indices;
    const pages = await merged.copyPages(src, indices);
    for (const page of pages) merged.addPage(page);
  }

  const bytes = await merged.save();
  return new Blob([bytes], {type: 'application/pdf'});
}
