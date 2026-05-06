// Hash Generator constants.

export const STORAGE_VERSION = '1.0.0';
export const STORAGE_KEY = 'hash_generator_state';
export const STATE_AUTOSAVE_DEBOUNCE_MS = 300;

// Live-recompute debounce while typing in text mode.
export const TEXT_DEBOUNCE_MS = 200;

export const MODES = {
  TEXT: 'text',
  FILE: 'file',
};
export const MODE_VALUES = [MODES.TEXT, MODES.FILE];

export const MODE_OPTIONS = [
  {value: MODES.TEXT, label: 'Text'},
  {value: MODES.FILE, label: 'File'},
];

// Algorithms shown side-by-side. SHA-* go through WebCrypto; MD5 uses
// spark-md5. Order here is the visual order in the UI.
export const ALGOS = ['SHA-256', 'SHA-512', 'SHA-1', 'MD5'];

// File-size warning threshold. The browser handles ArrayBuffer up to
// ~1 GB, but very large files take real wall-clock time to digest.
export const LARGE_FILE_WARN_BYTES = 500 * 1024 * 1024;

export const DEFAULT_STATE = {
  mode: MODES.TEXT,
};
