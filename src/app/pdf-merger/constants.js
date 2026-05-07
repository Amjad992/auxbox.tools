/* PDF Merger constants. Kept tool-local — these caps are PDF-specific.
   See plan.md for rationale on the chosen limits. */

export const PDF_MIME = 'application/pdf';

// Hard caps. The merge pipeline can technically handle more, but the UX
// (parse time, RAM pressure on the tab) gets sluggish past these limits.
export const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB per file
export const MAX_FILES = 8;

export const MERGED_FILENAME = 'merged.pdf';

// Friendly user-facing error messages. Centralised so tests + UI agree.
export const ERR_TOO_LARGE = `File is larger than 50 MB (max). PDFs above this risk crashing the tab.`;
export const ERR_TOO_MANY = `Limit of ${MAX_FILES} files reached. Remove a file before adding more.`;
export const ERR_NOT_PDF = `Not a PDF. This tool only accepts application/pdf files.`;
// ERR_ENCRYPTED and ERR_CORRUPT are canonical in src/lib/pdf.js.
// Re-exported here so existing imports in this tool continue to work.
export {ERR_ENCRYPTED, ERR_CORRUPT} from '../../lib/pdf';
