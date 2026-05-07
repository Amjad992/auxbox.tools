// Image Converter persisted state validator.

export {
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
} from '../../lib/storage';

import {TARGET_VALUES} from './constants';

const ALLOWED_KEYS = new Set(['target', 'quality']);

export function validateImageConverterState(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  if (typeof data.target !== 'string' || !TARGET_VALUES.includes(data.target))
    return false;
  if (
    typeof data.quality !== 'number' ||
    !Number.isFinite(data.quality) ||
    data.quality < 0.1 ||
    data.quality > 1
  )
    return false;
  for (const key of Object.keys(data)) {
    if (!ALLOWED_KEYS.has(key)) return false;
  }
  return true;
}
