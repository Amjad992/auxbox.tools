// Timestamp Converter constants.

export const STORAGE_VERSION = '1.0.0';
export const STORAGE_KEY = 'timestamp_converter_state';
export const STATE_AUTOSAVE_DEBOUNCE_MS = 300;

import {
  ZONE_OPTIONS as SHARED_ZONE_OPTIONS,
} from '../../lib/timezones';

// Special non-IANA entries.
export const ZONE_LOCAL = 'local';
export const ZONE_UTC = 'utc';

// Full picker list: device-local first, then the 20 shared IANA+UTC zones.
// UTC already appears in SHARED_ZONE_OPTIONS; ZONE_LOCAL is prepended as a
// tool-specific special.
export const ZONE_OPTIONS = [
  {value: ZONE_LOCAL, label: 'Local time (your device)'},
  ...SHARED_ZONE_OPTIONS,
];

export const ZONE_VALUES = ZONE_OPTIONS.map((z) => z.value);

export const DEFAULT_STATE = {
  zone: ZONE_LOCAL,
};
