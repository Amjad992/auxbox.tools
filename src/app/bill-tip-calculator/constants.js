// Bill & Tip Calculator constants.

export const STORAGE_VERSION = '1.0.0';
export const STORAGE_KEY = 'bill_tip_calculator_state';
export const STATE_AUTOSAVE_DEBOUNCE_MS = 300;

export const TIP_PRESETS = [0, 5, 10, 15, 20, 25, 30];

export const BOUNDS = {
  TIP_PCT_MIN: 0,
  TIP_PCT_MAX: 30,
  PEOPLE_MIN: 1,
  PEOPLE_MAX: 20,
};

export const DEFAULT_STATE = {
  currency: 'USD',
  bill: null,         // null = empty input
  tipPct: 0,          // user override — let the user pick their own tip
  people: 2,
};
