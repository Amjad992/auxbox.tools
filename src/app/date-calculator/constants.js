// Date Calculator constants.

export const STORAGE_VERSION = '1.0.0';
export const STORAGE_KEY = 'date_calculator_state';

export const MODES = {
  DIFFERENCE: 'difference',
  AGE: 'age',
};

export const MODE_VALUES = [MODES.DIFFERENCE, MODES.AGE];

export const MODE_OPTIONS = [
  {value: MODES.DIFFERENCE, label: 'Difference between two dates'},
  {value: MODES.AGE, label: 'Age from date'},
];

export const DEFAULT_STATE = {
  startDate: '',
  endDate: '',
  mode: MODES.DIFFERENCE,
  includeWorkingDays: false,
};

export const STATE_AUTOSAVE_DEBOUNCE_MS = 300;
