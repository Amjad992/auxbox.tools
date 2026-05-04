import {useCallback, useEffect, useRef, useState} from 'react';
import {DateTime} from 'luxon';
import {DEFAULT_STATE, STATUS} from './constants';
import {computeElapsed, lapDelta} from './utils';

// Wall-clock now via Luxon — keeps the codebase consistent with Date Calculator.
function defaultNow() {
  return DateTime.now().toMillis();
}

/**
 * Stopwatch state machine. Owns:
 *   - status: 'idle' | 'running' | 'paused'
 *   - startedAt: wall-clock ms (Date.now()) for the current run, or null
 *   - accumulatedMs: ms accrued in previous run/pause cycles
 *   - laps: [{index, totalElapsedMs, deltaMs}, ...]
 *
 * Persistence is layered on top in the page component (debounced auto-save +
 * dirty-ref gating + synchronous Reset wipe). This hook only owns the
 * in-memory state machine + transitions.
 *
 * @param {{now?: () => number}} [options]
 *   - `now` defaults to `DateTime.now().toMillis()`. Injectable for tests.
 */
export function useStopwatch({now = defaultNow} = {}) {
  const [status, setStatus] = useState(DEFAULT_STATE.status);
  const [startedAt, setStartedAt] = useState(DEFAULT_STATE.startedAt);
  const [accumulatedMs, setAccumulatedMs] = useState(DEFAULT_STATE.accumulatedMs);
  const [laps, setLaps] = useState(DEFAULT_STATE.laps);

  // Latest-state ref so callbacks can read without stale closures.
  const stateRef = useRef({status, startedAt, accumulatedMs, laps});
  useEffect(() => {
    stateRef.current = {status, startedAt, accumulatedMs, laps};
  }, [status, startedAt, accumulatedMs, laps]);

  const start = useCallback(() => {
    const cur = stateRef.current;
    if (cur.status === STATUS.RUNNING) return;
    setStartedAt(now());
    setStatus(STATUS.RUNNING);
  }, [now]);

  const stop = useCallback(() => {
    const cur = stateRef.current;
    if (cur.status !== STATUS.RUNNING) return;
    const elapsed = computeElapsed(cur, now());
    setAccumulatedMs(elapsed);
    setStartedAt(null);
    setStatus(STATUS.PAUSED);
  }, [now]);

  const lap = useCallback(() => {
    const cur = stateRef.current;
    if (cur.status !== STATUS.RUNNING) return;
    const total = computeElapsed(cur, now());
    const last = cur.laps.length > 0 ? cur.laps[cur.laps.length - 1].totalElapsedMs : 0;
    const delta = lapDelta(total, last);
    setLaps((prev) => [
      ...prev,
      {index: prev.length + 1, totalElapsedMs: total, deltaMs: delta},
    ]);
  }, [now]);

  const reset = useCallback(() => {
    setStatus(DEFAULT_STATE.status);
    setStartedAt(DEFAULT_STATE.startedAt);
    setAccumulatedMs(DEFAULT_STATE.accumulatedMs);
    setLaps(DEFAULT_STATE.laps);
  }, []);

  /** Restore a persisted snapshot; safe to call before any transition. */
  const restore = useCallback((snapshot) => {
    if (!snapshot) return;
    setStatus(snapshot.status);
    setStartedAt(snapshot.startedAt);
    setAccumulatedMs(snapshot.accumulatedMs);
    setLaps(Array.isArray(snapshot.laps) ? snapshot.laps : []);
  }, []);

  return {
    status,
    startedAt,
    accumulatedMs,
    laps,
    start,
    stop,
    lap,
    reset,
    restore,
  };
}
