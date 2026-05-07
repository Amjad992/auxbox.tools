export const STORAGE_VERSION = '1.0.0';
export const STORAGE_KEY = 'favicon_generator_state';
export const STATE_AUTOSAVE_DEBOUNCE_MS = 300;

export const FAVICON_SIZES = [
  {size: 16, filename: 'favicon-16.png', label: '16×16'},
  {size: 32, filename: 'favicon-32.png', label: '32×32'},
  {size: 180, filename: 'apple-touch-icon.png', label: '180×180 (Apple touch)'},
  {size: 192, filename: 'android-chrome-192.png', label: '192×192 (Android)'},
  {size: 512, filename: 'android-chrome-512.png', label: '512×512 (Android)'},
];

export const ICO_SIZES = [16, 32, 48];

export const DEFAULT_STATE = {
  includeIco: true,
  background: 'transparent',
};

export const BACKGROUND_OPTIONS = [
  {value: 'transparent', label: 'Transparent (PNG)'},
  {value: 'white', label: 'White'},
  {value: 'black', label: 'Black'},
];
export const BACKGROUND_VALUES = BACKGROUND_OPTIONS.map((o) => o.value);
