// UUID Generator constants.

export const STORAGE_VERSION = '1.0.0';
export const STORAGE_KEY = 'uuid_generator_state';
export const STATE_AUTOSAVE_DEBOUNCE_MS = 300;

export const TYPES = {
  V4: 'v4',
  V7: 'v7',
};
export const TYPE_VALUES = [TYPES.V4, TYPES.V7];

export const TYPE_OPTIONS = [
  {value: TYPES.V4, label: 'UUID v4 (random)'},
  {value: TYPES.V7, label: 'UUID v7 (timestamp-ordered)'},
];

export const COUNT_PRESETS = [1, 5, 10, 25, 50, 100];

export const BOUNDS = {
  COUNT_MIN: 1,
  COUNT_MAX: 100,
};

export const DEFAULT_STATE = {
  type: TYPES.V4,
  count: 10,
};
