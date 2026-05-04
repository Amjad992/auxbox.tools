// Pure helpers for the Pomodoro Timer.
// Wall-clock reads belong in the call site (Luxon `DateTime.now().toMillis()`);
// these functions take `now` / `todayIso` as arguments so they're trivially
// testable.

import {DateTime} from 'luxon';
import {HISTORY_WINDOW_DAYS, PHASE, STATUS} from './constants';

/** Duration in ms for a given phase under the supplied settings. */
export function durationFor(phase, settings) {
  if (!settings) return 0;
  switch (phase) {
    case PHASE.WORK:
      return Math.max(0, Number(settings.workMinutes) || 0) * 60_000;
    case PHASE.SHORT_BREAK:
      return Math.max(0, Number(settings.shortBreakMinutes) || 0) * 60_000;
    case PHASE.LONG_BREAK:
      return Math.max(0, Number(settings.longBreakMinutes) || 0) * 60_000;
    default:
      return 0;
  }
}

/**
 * Compute the next phase after the current one completes.
 *
 * From `work`: the (completedWorkSessions + 1)th completion lands on a long
 * break when `(completedWorkSessions + 1) % longBreakEvery === 0`, otherwise
 * a short break.
 * From either break: back to `work`.
 */
export function nextPhase(phase, completedWorkSessions, longBreakEvery) {
  const cadence = Math.max(1, Number(longBreakEvery) || 1);
  if (phase === PHASE.WORK) {
    const sessionAfter = (Number(completedWorkSessions) || 0) + 1;
    return sessionAfter % cadence === 0 ? PHASE.LONG_BREAK : PHASE.SHORT_BREAK;
  }
  return PHASE.WORK;
}

/**
 * Elapsed-in-current-phase ms.
 *   - idle: 0
 *   - paused: accumulatedMs
 *   - running: accumulatedMs + max(0, now - startedAt)
 */
export function elapsedSoFar(state, now) {
  if (!state) return 0;
  const {status, startedAt, accumulatedMs} = state;
  const base = Number.isFinite(accumulatedMs) ? Math.max(0, accumulatedMs) : 0;
  if (status === STATUS.RUNNING && typeof startedAt === 'number') {
    const delta = now - startedAt;
    return base + (delta > 0 ? delta : 0);
  }
  if (status === STATUS.PAUSED) return base;
  return 0;
}

/** Remaining ms in the current phase. Clamped at 0; never negative. */
export function computeRemaining(state, now, settings) {
  if (!state) return 0;
  const total = durationFor(state.phase, settings);
  const used = elapsedSoFar(state, now);
  const remaining = total - used;
  return remaining > 0 ? remaining : 0;
}

/**
 * Format a millisecond duration as `MM:SS` for the headline display. Rounds
 * UP to the next whole second so the display reads `25:00` (not `24:59`)
 * the instant a phase starts. Long phases (≥1 h) get an `H:MM:SS` form.
 */
export function formatRemaining(ms) {
  const safe = Number.isFinite(ms) && ms > 0 ? ms : 0;
  const totalSeconds = Math.ceil(safe / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);
  const pad2 = (n) => String(n).padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${pad2(minutes)}:${pad2(seconds)}`;
  }
  return `${pad2(minutes)}:${pad2(seconds)}`;
}

/**
 * Increment today's `completedPomodoros` count by 1. Pure: returns a new
 * history object; never mutates the input. `todayIso` is the local-date ISO
 * key, e.g. `2026-05-04`.
 */
export function incrementToday(history, todayIso) {
  if (!todayIso || typeof todayIso !== 'string') return history || {};
  const safe = history && typeof history === 'object' ? history : {};
  const prev = safe[todayIso]?.completedPomodoros;
  const prevCount = Number.isFinite(prev) && prev >= 0 ? prev : 0;
  return {
    ...safe,
    [todayIso]: {completedPomodoros: prevCount + 1},
  };
}

/**
 * Return the last `HISTORY_WINDOW_DAYS` calendar days as an array of
 * `{date: ISO, count: number}`, oldest first. `todayIso` is the local-date
 * ISO key for today; missing entries fill in as `count: 0`.
 */
export function last7Days(history, todayIso) {
  const safe = history && typeof history === 'object' ? history : {};
  const today = DateTime.fromISO(todayIso);
  if (!today.isValid) return [];
  const out = [];
  for (let i = HISTORY_WINDOW_DAYS - 1; i >= 0; i--) {
    const d = today.minus({days: i});
    const iso = d.toISODate();
    const entry = safe[iso];
    const raw = entry?.completedPomodoros;
    const count = Number.isFinite(raw) && raw >= 0 ? raw : 0;
    out.push({date: iso, count});
  }
  return out;
}

/** Today's pomodoro count, or 0. */
export function todayCount(history, todayIso) {
  if (!todayIso) return 0;
  const safe = history && typeof history === 'object' ? history : {};
  const raw = safe[todayIso]?.completedPomodoros;
  return Number.isFinite(raw) && raw >= 0 ? raw : 0;
}
