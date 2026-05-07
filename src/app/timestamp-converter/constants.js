// Timestamp Converter constants.

export const STORAGE_VERSION = '1.0.0';
export const STORAGE_KEY = 'timestamp_converter_state';
export const STATE_AUTOSAVE_DEBOUNCE_MS = 300;

// Curated time-zone list. Local + UTC are special; the rest are common
// IANA zones spanning the major regions. Users with an exotic zone can
// switch their OS timezone before opening the tool.
export const ZONE_LOCAL = 'local';
export const ZONE_UTC = 'utc';

export const ZONE_OPTIONS = [
  {value: ZONE_LOCAL, label: 'Local time (your device)'},
  {value: ZONE_UTC, label: 'UTC'},
  {value: 'America/Los_Angeles', label: 'America/Los_Angeles (PT)'},
  {value: 'America/New_York', label: 'America/New_York (ET)'},
  {value: 'America/Chicago', label: 'America/Chicago (CT)'},
  {value: 'Europe/London', label: 'Europe/London (GMT/BST)'},
  {value: 'Europe/Berlin', label: 'Europe/Berlin (CET/CEST)'},
  {value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST)'},
  {value: 'Asia/Riyadh', label: 'Asia/Riyadh (AST)'},
  {value: 'Asia/Dubai', label: 'Asia/Dubai (GST)'},
  {value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)'},
  {value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)'},
  {value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)'},
  {value: 'Asia/Shanghai', label: 'Asia/Shanghai (CST)'},
  {value: 'Australia/Sydney', label: 'Australia/Sydney (AEST)'},
];
export const ZONE_VALUES = ZONE_OPTIONS.map((z) => z.value);

export const DEFAULT_STATE = {
  zone: ZONE_LOCAL,
};
