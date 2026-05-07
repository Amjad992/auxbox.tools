// Color Contrast Checker persisted state validator.

export {
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
} from '../../lib/storage';

const ALLOWED_KEYS = new Set(['fg', 'bg']);

export function validateContrastCheckerState(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  if (typeof data.fg !== 'string' || typeof data.bg !== 'string') return false;
  for (const key of Object.keys(data)) {
    if (!ALLOWED_KEYS.has(key)) return false;
  }
  return true;
}
