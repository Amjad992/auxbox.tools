// Tip Calculator constants.

export const STORAGE_VERSION = '1.0.0';
export const STORAGE_KEY = 'tip_calculator_state';
export const STATE_AUTOSAVE_DEBOUNCE_MS = 300;

export const TIP_PRESETS = [15, 18, 20, 25];

export const BOUNDS = {
  TIP_PCT_MIN: 0,
  TIP_PCT_MAX: 30,
  PEOPLE_MIN: 1,
  PEOPLE_MAX: 20,
};

export const DEFAULT_STATE = {
  currency: 'USD',
  bill: null,         // null = empty input
  tipPct: 18,
  people: 2,
};
