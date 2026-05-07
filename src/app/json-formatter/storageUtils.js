// JSON Formatter persisted state validator.

export {
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
} from '../../lib/storage';

import {INDENT_VALUES, MODE_VALUES} from './constants';

const ALLOWED_KEYS = new Set(['mode', 'indent', 'sortKeys', 'liveFormat']);

export function validateJsonFormatterState(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  if (typeof data.mode !== 'string' || !MODE_VALUES.includes(data.mode))
    return false;
  if (typeof data.indent !== 'string' || !INDENT_VALUES.includes(data.indent))
    return false;
  if (typeof data.sortKeys !== 'boolean') return false;
  if (typeof data.liveFormat !== 'boolean') return false;
  for (const key of Object.keys(data)) {
    if (!ALLOWED_KEYS.has(key)) return false;
  }
  return true;
}
