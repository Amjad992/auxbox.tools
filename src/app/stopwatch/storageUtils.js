// Stopwatch persisted state validator.

export {
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
} from '../../lib/storage';

import {STATUS_VALUES, STATUS} from './constants';

function isFiniteNonNegative(n) {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0;
}

export function validateStopwatchState(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const {status, startedAt, accumulatedMs, laps} = data;

  if (typeof status !== 'string' || !STATUS_VALUES.includes(status)) return false;

  if (startedAt !== null && typeof startedAt !== 'number') return false;
  if (status === STATUS.RUNNING && typeof startedAt !== 'number') return false;
  if (typeof startedAt === 'number' && !Number.isFinite(startedAt)) return false;

  if (!isFiniteNonNegative(accumulatedMs)) return false;

  if (!Array.isArray(laps)) return false;
  for (const lap of laps) {
    if (!lap || typeof lap !== 'object') return false;
    if (typeof lap.index !== 'number' || !Number.isFinite(lap.index)) return false;
    if (!isFiniteNonNegative(lap.totalElapsedMs)) return false;
    if (!isFiniteNonNegative(lap.deltaMs)) return false;
  }

  return true;
}
