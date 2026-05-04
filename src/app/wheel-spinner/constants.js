// Wheel-spinner constants. Visuals (palette HSL parameters, animation
// timings) live here so tests can pin them and the components share the
// same tuning.

export const MIN_ENTRIES = 2;
export const MAX_ENTRIES_FULL_LABELS = 50;
export const MAX_ENTRIES_SOFT_CAP = 100; // beyond this we still render but warn

export const QUICK_PICK_DURATION_MS = 1500;
export const QUICK_PICK_STEPS = 32;
// Easing exponent for the deceleration: higher = sharper slowdown at the end.
export const QUICK_PICK_DECEL_POWER = 2.4;

export const SPIN_DURATION_MS = 3000;
export const SPIN_EXTRA_TURNS = 5;
export const SPIN_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';

// HSL palette parameters — saturation/lightness fixed, hue stepped per slice.
// Same list always produces the same colours.
export const PALETTE_SATURATION = 65;
export const PALETTE_LIGHTNESS = 52;

// Presentation axis: how the choice is animated.
export const PRESENTATIONS = {
  QUICK: 'quick',
  WHEEL: 'wheel',
};

// Session axis: whether each pick is independent or eliminates from a
// running "Picks so far" list until the working list is empty.
export const SESSION_MODES = {
  SINGLE: 'single',
  MULTIPLE: 'multiple',
};

export const DEFAULT_STATE = {
  options: [],
  presentation: PRESENTATIONS.QUICK,
  sessionMode: SESSION_MODES.SINGLE,
};

export const STORAGE_VERSION = '1.0.0';
export const STORAGE_KEY = 'wheel_spinner_state';

export const STATE_AUTOSAVE_DEBOUNCE_MS = 300;

// Option arrays for the shared <ModeToggle /> segmented control.
export const PRESENTATION_OPTIONS = [
  {value: PRESENTATIONS.QUICK, label: 'Quick Pick'},
  {value: PRESENTATIONS.WHEEL, label: 'Spin Wheel'},
];

export const SESSION_OPTIONS = [
  {value: SESSION_MODES.SINGLE, label: 'Single pick'},
  {value: SESSION_MODES.MULTIPLE, label: 'Pick multiple'},
];
