// Time Zone Converter persisted state validator.

export {
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
} from '../../lib/storage';

import {MAX_TARGETS, ZONE_VALUES} from './constants';

const ALLOWED_KEYS = new Set(['anchorZone', 'targets']);

export function validateTimezoneConverterState(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  if (
    typeof data.anchorZone !== 'string' ||
    !ZONE_VALUES.includes(data.anchorZone)
  )
    return false;
  if (!Array.isArray(data.targets)) return false;
  if (data.targets.length > MAX_TARGETS) return false;
  for (const z of data.targets) {
    if (typeof z !== 'string' || !ZONE_VALUES.includes(z)) return false;
  }
  for (const key of Object.keys(data)) {
    if (!ALLOWED_KEYS.has(key)) return false;
  }
  return true;
}
