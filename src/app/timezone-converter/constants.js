// Time Zone Converter constants.

export const STORAGE_VERSION = '1.0.0';
export const STORAGE_KEY = 'timezone_converter_state';
export const STATE_AUTOSAVE_DEBOUNCE_MS = 300;

// Canonical zone list — sourced from the shared lib. Re-exported so tool
// modules can import from this file without reaching into src/lib directly.
export {ZONE_OPTIONS, ZONE_VALUES} from '../../lib/timezones';

export const DEFAULT_ANCHOR_ZONE = 'utc';
export const DEFAULT_TARGETS = [
  'America/New_York',
  'Europe/London',
  'Asia/Tokyo',
];

// Storage cap on number of target rows.
export const MAX_TARGETS = 12;

export const DEFAULT_STATE = {
  anchorZone: DEFAULT_ANCHOR_ZONE,
  targets: DEFAULT_TARGETS, // array of zone strings
};
