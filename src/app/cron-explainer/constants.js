// Cron Expression Explainer constants.

export const STORAGE_VERSION = '1.0.0';
export const STORAGE_KEY = 'cron_explainer_state';

export const DEFAULT_STATE = {expression: ''};

// Auto-save debounce — small enough that the user's draft persists almost
// immediately, large enough to avoid a write on every keystroke.
export const STATE_AUTOSAVE_DEBOUNCE_MS = 300;

// Soft cap on persisted expression length. Cron expressions are short by
// nature; anything beyond this is almost certainly junk paste.
export const MAX_PERSISTED_CHARS = 1000;

// Number of upcoming fire times shown when the expression parses cleanly.
export const NEXT_RUNS_COUNT = 5;

// Preset chip patterns. Each maps a cron expression to a short label.
export const PRESETS = [
  {expression: '* * * * *', label: 'Every minute'},
  {expression: '0 * * * *', label: 'Every hour'},
  {expression: '0 9 * * *', label: 'Daily at 9 AM'},
  {expression: '0 9 * * 1-5', label: 'Weekdays at 9 AM'},
  {expression: '*/15 * * * *', label: 'Every 15 minutes'},
  {expression: '0 0 * * 0', label: 'Weekly (Sun midnight)'},
  {expression: '0 0 1 * *', label: 'Monthly (1st midnight)'},
  {expression: '0 0 1 1 *', label: 'Yearly'},
];
