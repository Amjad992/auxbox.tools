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

export function validateHashGeneratorState(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  if (typeof data.mode !== 'string' || !MODE_VALUES.includes(data.mode))
    return false;
  return true;
}
