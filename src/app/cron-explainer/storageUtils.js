// Cron Explainer persisted state. One slot:
//   { expression: string }

export {
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
} from '../../lib/storage';

import {MAX_PERSISTED_CHARS} from './constants';

export function validateCronExplainerState(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const {expression} = data;
  if (typeof expression !== 'string') return false;
  if (expression.length > MAX_PERSISTED_CHARS) return false;
  return true;
}
