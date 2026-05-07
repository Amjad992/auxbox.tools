// CSV ↔ JSON Converter persisted state validator.

export {
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
} from '../../lib/storage';

import {DELIMITER_VALUES, DIRECTION_VALUES} from './constants';

const ALLOWED_KEYS = new Set([
  'direction',
  'delimiter',
  'hasHeader',
  'inferTypes',
  'prettyJson',
]);

export function validateCsvJsonState(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  if (typeof data.direction !== 'string' || !DIRECTION_VALUES.includes(data.direction))
    return false;
  if (typeof data.delimiter !== 'string' || !DELIMITER_VALUES.includes(data.delimiter))
    return false;
  if (typeof data.hasHeader !== 'boolean') return false;
  if (typeof data.inferTypes !== 'boolean') return false;
  if (typeof data.prettyJson !== 'boolean') return false;
  for (const key of Object.keys(data)) {
    if (!ALLOWED_KEYS.has(key)) return false;
  }
  return true;
}
