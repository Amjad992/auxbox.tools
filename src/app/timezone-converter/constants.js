// Time Zone Converter constants.

export const STORAGE_VERSION = '1.0.0';
export const STORAGE_KEY = 'timezone_converter_state';
export const STATE_AUTOSAVE_DEBOUNCE_MS = 300;

// Curated zone list. The same set as timestamp-converter (kept independent
// to avoid coupling — small enough to duplicate). Exported for the picker.
export const ZONE_OPTIONS = [
  {value: 'utc', label: 'UTC'},
  {value: 'America/Los_Angeles', label: 'America/Los_Angeles (PT)'},
  {value: 'America/Denver', label: 'America/Denver (MT)'},
  {value: 'America/Chicago', label: 'America/Chicago (CT)'},
  {value: 'America/New_York', label: 'America/New_York (ET)'},
  {value: 'America/Sao_Paulo', label: 'America/Sao_Paulo (BRT)'},
  {value: 'Europe/London', label: 'Europe/London (GMT/BST)'},
  {value: 'Europe/Berlin', label: 'Europe/Berlin (CET/CEST)'},
  {value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST)'},
  {value: 'Africa/Lagos', label: 'Africa/Lagos (WAT)'},
  {value: 'Africa/Cairo', label: 'Africa/Cairo (EET)'},
  {value: 'Asia/Riyadh', label: 'Asia/Riyadh (AST)'},
  {value: 'Asia/Dubai', label: 'Asia/Dubai (GST)'},
  {value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)'},
  {value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)'},
  {value: 'Asia/Hong_Kong', label: 'Asia/Hong_Kong (HKT)'},
  {value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)'},
  {value: 'Asia/Shanghai', label: 'Asia/Shanghai (CST)'},
  {value: 'Australia/Sydney', label: 'Australia/Sydney (AEST)'},
  {value: 'Pacific/Auckland', label: 'Pacific/Auckland (NZST)'},
];
export const ZONE_VALUES = ZONE_OPTIONS.map((z) => z.value);

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
