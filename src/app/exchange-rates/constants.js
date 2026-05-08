// Exchange Rates tool constants.

export const STORAGE_VERSION = '1.0.0';
export const STORAGE_KEY = 'exchange_rates_state';
export const STATE_AUTOSAVE_DEBOUNCE_MS = 300;

// Historical floor for fawazahmed0 (data starts around 2017-01-01).
export const DATE_MIN = '2017-01-01';

// Default base currency.
export const DEFAULT_BASE = 'USD';

// Default target currencies — a curated mix that covers major + regional.
export const DEFAULT_TARGETS = ['EUR', 'GBP', 'SAR', 'PKR', 'JPY', 'AED'];

// Default conversion amount.
export const DEFAULT_AMOUNT = 1;

// Session-storage TTL for cached API responses (5 minutes in ms).
export const SESSION_CACHE_TTL_MS = 5 * 60 * 1000;

// Maximum number of target currencies shown at once.
export const MAX_TARGETS = 20;

// Regex for a valid currency code stored in localStorage.
export const CURRENCY_CODE_RE = /^[A-Z0-9]{2,10}$/;

// Regex for a stored date string (YYYY-MM-DD).
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const DEFAULT_STATE = {
  base: DEFAULT_BASE,
  targets: DEFAULT_TARGETS,
  amount: DEFAULT_AMOUNT,
  // lastDate is NOT stored by default; the page always defaults to today.
};
