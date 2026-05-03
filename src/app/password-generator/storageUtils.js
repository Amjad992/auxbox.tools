// Password-generator-specific storage keys, version, and validators.
// Generic primitives live in src/lib/storage.js.
//
// IMPORTANT: We persist user *settings* (length + class toggles) only.
// Generated passwords are NEVER persisted.

export {
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
} from '../../lib/storage';

import {MIN_LENGTH, MAX_LENGTH} from './constants';

export const STORAGE_KEYS = {
  SETTINGS: 'password_generator_settings',
};

export const STORAGE_VERSION = '1.0.0';

export function validatePasswordSettings(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const {length, upper, lower, digits, symbols, excludeAmbiguous} = data;

  if (
    !Number.isInteger(length) ||
    length < MIN_LENGTH ||
    length > MAX_LENGTH
  ) {
    return false;
  }
  if (
    typeof upper !== 'boolean' ||
    typeof lower !== 'boolean' ||
    typeof digits !== 'boolean' ||
    typeof symbols !== 'boolean' ||
    typeof excludeAmbiguous !== 'boolean'
  ) {
    return false;
  }
  // At least one class must be enabled — otherwise there's nothing to generate from.
  if (!(upper || lower || digits || symbols)) return false;

  return true;
}
