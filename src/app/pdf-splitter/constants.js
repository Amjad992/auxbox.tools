// PDF Splitter constants.

import {formatBytes} from '../../lib/format';

export const STORAGE_VERSION = '1.0.0';
export const STORAGE_KEY = 'pdf_splitter_state';
export const STATE_AUTOSAVE_DEBOUNCE_MS = 300;

export const PDF_MIME = 'application/pdf';
export const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB — matches pdf-merger cap
// Warn the user when the file is over this threshold; the main thread may
// stall for several seconds while pdf-lib processes the data.
export const LARGE_FILE_WARN_BYTES = 25 * 1024 * 1024; // 25 MB

export const ERR_NOT_PDF = 'Not a PDF file.';
export const ERR_TOO_LARGE = `File too large (max ${formatBytes(MAX_FILE_BYTES)}).`;

// ERR_CORRUPT and ERR_ENCRYPTED are canonical in src/lib/pdf.js.
// Re-exported here so imports within this tool can use either path.
export {ERR_CORRUPT, ERR_ENCRYPTED} from '../../lib/pdf';

export const DEFAULT_STATE = {
  // Mode is currently fixed at "extract". The strict-keys validator in
  // storageUtils.js rejects unknown mode values, which is the right defensive
  // default; do not add modes here without also updating ALLOWED_MODES there.
  mode: 'extract',
};
