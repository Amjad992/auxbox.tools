// Hash Generator persisted state validator + storage re-export.
//
// Privacy-by-default: the input text and any uploaded file are NEVER
// persisted. Only the user's preferred mode (Text / File) is stored,
// so the UI re-opens to whichever surface they used last. This is the
// whole privacy promise — bend with care.

export {
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
} from '../../lib/storage';

import {MODE_VALUES} from './constants';

// The single allowed key. Any other field present in the persisted
// payload is a load-bearing privacy violation: someone added input data
// to the save call. Reject the whole blob loudly so the regression is
// caught the next time the page hydrates.
const ALLOWED_KEYS = new Set(['mode']);

export function validateHashGeneratorState(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  if (typeof data.mode !== 'string' || !MODE_VALUES.includes(data.mode))
    return false;
  for (const key of Object.keys(data)) {
    if (!ALLOWED_KEYS.has(key)) return false;
  }
  return true;
}
