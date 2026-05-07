// Color Contrast Checker constants.

export const STORAGE_VERSION = '1.0.0';
export const STORAGE_KEY = 'contrast_checker_state';
export const STATE_AUTOSAVE_DEBOUNCE_MS = 300;

// WCAG 2.x success-criterion thresholds.
export const THRESHOLDS = {
  AA_NORMAL: 4.5,
  AA_LARGE: 3.0,
  AAA_NORMAL: 7.0,
  AAA_LARGE: 4.5,
};

export const DEFAULT_STATE = {
  fg: '#1a1a1a',
  bg: '#ffffff',
};
