export const STORAGE_VERSION = '1.0.0';
export const STORAGE_KEY = 'palette_from_image_state';
export const STATE_AUTOSAVE_DEBOUNCE_MS = 300;

export const MIN_COLOURS = 2;
export const MAX_COLOURS = 16;
export const DEFAULT_COLOURS = 6;

// Sample at most ~50 000 pixels for the quantizer.
// Bigger inputs are bilinearly downsampled — gives the median-cut algorithm
// plenty of variance without blowing up the main thread.
export const MAX_SAMPLE_PIXELS = 50_000;

export const FORMAT_OPTIONS = [
  {value: 'hex', label: 'Hex'},
  {value: 'rgb', label: 'RGB'},
  {value: 'tailwind', label: 'Nearest Tailwind'},
];
export const FORMAT_VALUES = FORMAT_OPTIONS.map((o) => o.value);

export const DEFAULT_STATE = {
  colourCount: DEFAULT_COLOURS,
  format: 'hex',
};
