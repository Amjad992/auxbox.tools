// UUID Generator persisted state validator.

export {
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
} from '../../lib/storage';

import {BOUNDS, TYPE_VALUES} from './constants';

const ALLOWED_KEYS = new Set(['type', 'count']);

export function validateUuidGeneratorState(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  if (typeof data.type !== 'string' || !TYPE_VALUES.includes(data.type))
    return false;
  if (
    typeof data.count !== 'number' ||
    !Number.isInteger(data.count) ||
    data.count < BOUNDS.COUNT_MIN ||
    data.count > BOUNDS.COUNT_MAX
  )
    return false;
  for (const key of Object.keys(data)) {
    if (!ALLOWED_KEYS.has(key)) return false;
  }
  return true;
}
