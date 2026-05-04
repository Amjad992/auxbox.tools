import {useCallback, useEffect, useRef, useState} from 'react';
import {DateTime} from 'luxon';
import {
  DEFAULT_HISTORY,
  DEFAULT_RUNTIME,
  DEFAULT_SETTINGS,
  PHASE,
  STATUS,
} from './constants';
import {
  computeRemaining,
  durationFor,
  elapsedSoFar,
  incrementToday,
  nextPhase,
} from './utils';

function defaultNow() {
  return DateTime.now().toMillis();
}
function defaultTodayIso() {
  return DateTime.local().toISODate();
}

/**
 * Pomodoro Timer state machine. Owns:
 *   - settings: { workMinutes, shortBreakMinutes, longBreakMinutes,
 *                 longBreakEvery, muted, notifyEnabled }
 *   - runtime:  { phase, status, startedAt, accumulatedMs,
 *                 completedWorkSessions }
 *   - history:  { [isoDate]: { completedPomodoros: number } }
 *
 * Phase auto-completion is detected by the consumer via the live tick: when
 * `computeRemaining()` reaches 0 the consumer calls `completePhase(now)`,
 * which fires the side-effect callback (audio/notification) and rolls into
 * the next phase in `paused` status.
 *
 * Timing: wall-clock reads default to `DateTime.now().toMillis()` (Luxon),
 * `todayIso` defaults to `DateTime.local().toISODate()`. Both are injectable
 * for tests (e.g. midnight rollover by feeding a different `todayIso`).
 */
export function usePomodoro({now = defaultNow, todayIso = defaultTodayIso} = {}) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [runtime, setRuntime] = useState(DEFAULT_RUNTIME);
  const [history, setHistory] = useState(DEFAULT_HISTORY);

  const stateRef = useRef({settings, runtime, history});
  useEffect(() => {
    stateRef.current = {settings, runtime, history};
  }, [settings, runtime, history]);

  const start = useCallback(() => {
    const {runtime: r} = stateRef.current;
    if (r.status === STATUS.RUNNING) return;
    setRuntime({
      ...r,
      status: STATUS.RUNNING,
      startedAt: now(),
    });
  }, [now]);

  const pause = useCallback(() => {
    const {runtime: r} = stateRef.current;
    if (r.status !== STATUS.RUNNING) return;
    const acc = elapsedSoFar(r, now());
    setRuntime({
      ...r,
      status: STATUS.PAUSED,
      startedAt: null,
      accumulatedMs: acc,
    });
  }, [now]);

  /**
   * Phase completion. Returns the phase that just completed (so the consumer
   * can fire side effects keyed on it: audio, notification copy). The new
   * runtime lands on the next phase in `paused` status — the user must press
   * Start to begin the next interval.
   */
  const completePhase = useCallback(
    () => {
      const {settings: s, runtime: r, history: h} = stateRef.current;
      const completedPhase = r.phase;
      const wasWork = completedPhase === PHASE.WORK;
      const newCompletedWork = wasWork
        ? r.completedWorkSessions + 1
        : r.completedWorkSessions;
      const np = nextPhase(r.phase, r.completedWorkSessions, s.longBreakEvery);

      if (wasWork) {
        const iso = todayIso();
        setHistory((prev) => incrementToday(prev || h, iso));
      }

      setRuntime({
        phase: np,
        status: STATUS.PAUSED,
        startedAt: null,
        accumulatedMs: 0,
        completedWorkSessions: newCompletedWork,
      });

      return completedPhase;
    },
    [todayIso]
  );

  /** Skip = same as completePhase but does NOT increment history. */
  const skip = useCallback(() => {
    const {settings: s, runtime: r} = stateRef.current;
    const np = nextPhase(r.phase, r.completedWorkSessions, s.longBreakEvery);
    setRuntime({
      phase: np,
      status: STATUS.PAUSED,
      startedAt: null,
      accumulatedMs: 0,
      completedWorkSessions: r.completedWorkSessions,
    });
  }, []);

  /**
   * Reset wipes runtime back to defaults. Settings and history are
   * preserved.
   */
  const reset = useCallback(() => {
    setRuntime(DEFAULT_RUNTIME);
  }, []);

  /** Update one or more settings. Bounds-checking is the caller's job. */
  const updateSettings = useCallback((patch) => {
    setSettings((prev) => ({...prev, ...patch}));
  }, []);

  /** Restore a persisted snapshot. Safe to call before any transition. */
  const restore = useCallback((snapshot) => {
    if (!snapshot || typeof snapshot !== 'object') return;
    if (snapshot.settings) setSettings({...DEFAULT_SETTINGS, ...snapshot.settings});
    if (snapshot.runtime) setRuntime({...DEFAULT_RUNTIME, ...snapshot.runtime});
    if (snapshot.history && typeof snapshot.history === 'object') {
      setHistory(snapshot.history);
    }
  }, []);

  /** Read-only convenience: current remaining ms at wall-clock `now`. */
  const remainingAt = useCallback(
    (atNow) => computeRemaining(runtime, atNow, settings),
    [runtime, settings]
  );

  /** Read-only convenience: total ms for the current phase. */
  const currentPhaseDurationMs = durationFor(runtime.phase, settings);

  return {
    settings,
    runtime,
    history,
    start,
    pause,
    skip,
    reset,
    completePhase,
    updateSettings,
    restore,
    remainingAt,
    currentPhaseDurationMs,
  };
}
