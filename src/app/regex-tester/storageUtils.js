// Regex Tester persisted state validator.

export {
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
} from '../../lib/storage';

import {FLAG_VALUES} from './constants';

const ALLOWED_KEYS = new Set(['pattern', 'flags', 'test']);

export function validateRegexTesterState(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  if (typeof data.pattern !== 'string') return false;
  if (typeof data.flags !== 'string') return false;
  // Flags string must contain only known characters with no duplicates.
  const seen = new Set();
  for (const f of data.flags) {
    if (!FLAG_VALUES.includes(f)) return false;
    if (seen.has(f)) return false;
    seen.add(f);
  }
  if (typeof data.test !== 'string') return false;
  for (const key of Object.keys(data)) {
    if (!ALLOWED_KEYS.has(key)) return false;
  }
  return true;
}
