// Pomodoro Timer constants.

export const STORAGE_VERSION = '1.0.0';
export const STORAGE_KEY = 'pomodoro_timer_state';

export const PHASE = {
  WORK: 'work',
  SHORT_BREAK: 'shortBreak',
  LONG_BREAK: 'longBreak',
};
export const PHASE_VALUES = [PHASE.WORK, PHASE.SHORT_BREAK, PHASE.LONG_BREAK];

export const PHASE_LABELS = {
  [PHASE.WORK]: 'Work',
  [PHASE.SHORT_BREAK]: 'Short break',
  [PHASE.LONG_BREAK]: 'Long break',
};

export const STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
};
export const STATUS_VALUES = [STATUS.IDLE, STATUS.RUNNING, STATUS.PAUSED];

export const DEFAULT_SETTINGS = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakEvery: 4,
  muted: false,
  notifyEnabled: false,
};

export const DEFAULT_RUNTIME = {
  phase: PHASE.WORK,
  status: STATUS.IDLE,
  startedAt: null,
  accumulatedMs: 0,
  completedWorkSessions: 0,
};

export const DEFAULT_HISTORY = {};

export const DEFAULT_STATE = {
  settings: DEFAULT_SETTINGS,
  runtime: DEFAULT_RUNTIME,
  history: DEFAULT_HISTORY,
};

export const STATE_AUTOSAVE_DEBOUNCE_MS = 300;

export const CHIME_URL = '/sounds/pomodoro-chime.wav';

// Slider bounds for the four duration / cadence settings.
export const WORK_MIN = 1;
export const WORK_MAX = 60;
export const SHORT_BREAK_MIN = 1;
export const SHORT_BREAK_MAX = 30;
export const LONG_BREAK_MIN = 1;
export const LONG_BREAK_MAX = 60;
export const LONG_BREAK_EVERY_MIN = 2;
export const LONG_BREAK_EVERY_MAX = 12;

// History strip rendering window.
export const HISTORY_WINDOW_DAYS = 7;
