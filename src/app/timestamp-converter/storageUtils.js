// Timestamp Converter persisted state validator.

export {
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
} from '../../lib/storage';

import {ZONE_VALUES} from './constants';

const ALLOWED_KEYS = new Set(['zone']);

export function validateTimestampConverterState(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  if (typeof data.zone !== 'string' || !ZONE_VALUES.includes(data.zone))
    return false;
  for (const key of Object.keys(data)) {
    if (!ALLOWED_KEYS.has(key)) return false;
  }
  return true;
}
