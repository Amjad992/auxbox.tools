// Pomodoro Timer persisted state validator.

export {
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
} from '../../lib/storage';

import {PHASE_VALUES, STATUS, STATUS_VALUES} from './constants';

function isFiniteNonNegative(n) {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0;
}

function isFiniteInteger(n) {
  return typeof n === 'number' && Number.isFinite(n) && Number.isInteger(n);
}

function validateSettings(settings) {
  if (!settings || typeof settings !== 'object') return false;
  const {
    workMinutes,
    shortBreakMinutes,
    longBreakMinutes,
    longBreakEvery,
    muted,
    notifyEnabled,
  } = settings;
  if (!isFiniteNonNegative(workMinutes)) return false;
  if (!isFiniteNonNegative(shortBreakMinutes)) return false;
  if (!isFiniteNonNegative(longBreakMinutes)) return false;
  if (!isFiniteInteger(longBreakEvery) || longBreakEvery < 1) return false;
  if (typeof muted !== 'boolean') return false;
  if (typeof notifyEnabled !== 'boolean') return false;
  return true;
}

function validateRuntime(runtime) {
  if (!runtime || typeof runtime !== 'object') return false;
  const {phase, status, startedAt, accumulatedMs, completedWorkSessions} =
    runtime;
  if (!PHASE_VALUES.includes(phase)) return false;
  if (!STATUS_VALUES.includes(status)) return false;
  if (startedAt !== null && typeof startedAt !== 'number') return false;
  if (typeof startedAt === 'number' && !Number.isFinite(startedAt)) return false;
  if (status === STATUS.RUNNING && typeof startedAt !== 'number') return false;
  if (!isFiniteNonNegative(accumulatedMs)) return false;
  if (!isFiniteInteger(completedWorkSessions) || completedWorkSessions < 0)
    return false;
  return true;
}

function validateHistory(history) {
  if (history === null || history === undefined) return false;
  if (typeof history !== 'object' || Array.isArray(history)) return false;
  for (const [key, entry] of Object.entries(history)) {
    if (typeof key !== 'string' || key.length === 0) return false;
    if (!entry || typeof entry !== 'object') return false;
    if (!isFiniteInteger(entry.completedPomodoros) || entry.completedPomodoros < 0)
      return false;
  }
  return true;
}

export function validatePomodoroState(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  if (!validateSettings(data.settings)) return false;
  if (!validateRuntime(data.runtime)) return false;
  if (!validateHistory(data.history)) return false;
  return true;
}
