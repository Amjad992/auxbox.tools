// PDF Splitter persisted state validator.

export {
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
} from '../../lib/storage';

const ALLOWED_KEYS = new Set(['mode']);
const ALLOWED_MODES = new Set(['extract']);

export function validatePdfSplitterState(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  if (typeof data.mode !== 'string' || !ALLOWED_MODES.has(data.mode))
    return false;
  for (const key of Object.keys(data)) {
    if (!ALLOWED_KEYS.has(key)) return false;
  }
  return true;
}
