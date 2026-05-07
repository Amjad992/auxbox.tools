// JSON Formatter constants.

export const STORAGE_VERSION = '1.0.0';
export const STORAGE_KEY = 'json_formatter_state';
export const STATE_AUTOSAVE_DEBOUNCE_MS = 300;

export const MODES = {
  FORMAT: 'format',
  MINIFY: 'minify',
  VALIDATE: 'validate',
};
export const MODE_VALUES = [MODES.FORMAT, MODES.MINIFY, MODES.VALIDATE];
export const MODE_OPTIONS = [
  {value: MODES.FORMAT, label: 'Format'},
  {value: MODES.MINIFY, label: 'Minify'},
  {value: MODES.VALIDATE, label: 'Validate'},
];

export const INDENT_OPTIONS = [
  {value: '2', label: '2 spaces'},
  {value: '4', label: '4 spaces'},
  {value: 'tab', label: 'Tab'},
];
export const INDENT_VALUES = INDENT_OPTIONS.map((o) => o.value);

export const DEFAULT_STATE = {
  mode: MODES.FORMAT,
  indent: '2',
  sortKeys: false,
  liveFormat: true,
};
