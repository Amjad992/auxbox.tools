// Stopwatch constants.

export const STORAGE_VERSION = '1.0.0';
export const STORAGE_KEY = 'stopwatch_state';

export const STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
};

export const STATUS_VALUES = [STATUS.IDLE, STATUS.RUNNING, STATUS.PAUSED];

export const DEFAULT_STATE = {
  status: STATUS.IDLE,
  startedAt: null,
  accumulatedMs: 0,
  laps: [],
};

export const STATE_AUTOSAVE_DEBOUNCE_MS = 300;
