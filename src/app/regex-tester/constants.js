// Regex Tester constants.

export const STORAGE_VERSION = '1.0.0';
export const STORAGE_KEY = 'regex_tester_state';
export const STATE_AUTOSAVE_DEBOUNCE_MS = 300;

// Supported flags (the modern subset). 'y' (sticky) is excluded — it
// changes the match-loop semantics and confuses users testing patterns.
export const FLAG_OPTIONS = [
  {value: 'g', label: 'g — global (find all)'},
  {value: 'i', label: 'i — case-insensitive'},
  {value: 'm', label: 'm — multiline (^/$ per line)'},
  {value: 's', label: 's — dotall (. matches \\n)'},
  {value: 'u', label: 'u — unicode'},
];
export const FLAG_VALUES = FLAG_OPTIONS.map((f) => f.value);

export const PRESETS = [
  {label: 'Email', pattern: '[\\w.+-]+@[\\w-]+\\.[\\w.-]+', flags: 'g'},
  {
    label: 'URL',
    pattern: 'https?:\\/\\/[\\w\\-._~:/?#\\[\\]@!$&\'()*+,;=%]+',
    flags: 'gi',
  },
  {label: 'IPv4', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', flags: 'g'},
  {label: 'Hex color', pattern: '#(?:[0-9a-f]{3}){1,2}\\b', flags: 'gi'},
  {label: 'ISO date', pattern: '\\d{4}-\\d{2}-\\d{2}', flags: 'g'},
];

export const DEFAULT_STATE = {
  pattern: '',
  flags: 'g',
  test: '',
};
