// Date Calculator persisted state validator.

export {
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
} from '../../lib/storage';

import {MODE_VALUES} from './constants';

export function validateDateCalculatorState(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const {startDate, endDate, mode, includeWorkingDays} = data;
  // Dates are stored as ISO date strings or null (empty / not set).
  if (startDate !== null && typeof startDate !== 'string') return false;
  if (endDate !== null && typeof endDate !== 'string') return false;
  if (typeof mode !== 'string' || !MODE_VALUES.includes(mode)) return false;
  if (typeof includeWorkingDays !== 'boolean') return false;
  return true;
}
