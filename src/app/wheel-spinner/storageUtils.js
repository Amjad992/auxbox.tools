// Wheel-spinner persisted state. One slot, one key:
//   { options: string[], presentation: 'quick'|'wheel', sessionMode: 'single'|'multiple' }
// Picks (the running "Picks so far" list) are session-only and NEVER persisted.

export {
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
} from '../../lib/storage';

import {
  PRESENTATIONS,
  SESSION_MODES,
  MAX_ENTRIES_SOFT_CAP,
} from './constants';

export function validateWheelSpinnerState(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const {options, presentation, sessionMode} = data;
  if (!Array.isArray(options)) return false;
  if (options.length > MAX_ENTRIES_SOFT_CAP) return false;
  for (const o of options) {
    if (typeof o !== 'string') return false;
    if (o.length > 500) return false;
  }
  if (presentation !== PRESENTATIONS.QUICK && presentation !== PRESENTATIONS.WHEEL) {
    return false;
  }
  if (
    sessionMode !== SESSION_MODES.SINGLE &&
    sessionMode !== SESSION_MODES.MULTIPLE
  ) {
    return false;
  }
  return true;
}
