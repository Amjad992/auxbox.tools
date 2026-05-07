// PDF Splitter constants.

export const STORAGE_VERSION = '1.0.0';
export const STORAGE_KEY = 'pdf_splitter_state';
export const STATE_AUTOSAVE_DEBOUNCE_MS = 300;

export const PDF_MIME = 'application/pdf';
export const MAX_FILE_BYTES = 100 * 1024 * 1024; // 100 MB

export const ERR_NOT_PDF = 'Not a PDF file.';
export const ERR_TOO_LARGE = 'File too large (max 100 MB).';
export const ERR_ENCRYPTED =
  'PDF is encrypted/password-protected. Unlock it before extracting.';
export const ERR_CORRUPT = 'PDF could not be parsed (corrupt file).';

export const DEFAULT_STATE = {
  // Mode is currently fixed at "extract" — kept as a settings field so
  // future modes (split-each, page-extract-as-images) can be added without
  // a storage migration.
  mode: 'extract',
};
