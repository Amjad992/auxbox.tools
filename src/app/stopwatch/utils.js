// Pure helpers for the Stopwatch tool.

import {STATUS} from './constants';

/**
 * Format a millisecond duration as `HH:MM:SS.mmm` (when ≥1 hour) or
 * `MM:SS.mmm` otherwise. Negative inputs are clamped to 0.
 *
 * @param {number} ms
 * @returns {string}
 */
export function formatHMSms(ms) {
  const safe = Number.isFinite(ms) && ms > 0 ? ms : 0;
  const totalMs = Math.floor(safe);
  const millis = totalMs % 1000;
  const totalSeconds = Math.floor(totalMs / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  const pad2 = (n) => String(n).padStart(2, '0');
  const pad3 = (n) => String(n).padStart(3, '0');

  if (hours > 0) {
    return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}.${pad3(millis)}`;
  }
  return `${pad2(minutes)}:${pad2(seconds)}.${pad3(millis)}`;
}

/**
 * Format a millisecond duration as a compact tab-title string. Rounds down
 * to the second since titles update once-per-second.
 *
 * Examples: `0:00`, `0:23`, `4:07`, `1:02:35`.
 */
export function formatTitleTime(ms) {
  const safe = Number.isFinite(ms) && ms > 0 ? ms : 0;
  const totalSeconds = Math.floor(safe / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);
  const pad2 = (n) => String(n).padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${pad2(minutes)}:${pad2(seconds)}`;
  }
  return `${minutes}:${pad2(seconds)}`;
}

/**
 * Compute the live elapsed milliseconds for a stopwatch state at wall-clock
 * `now`.
 *
 * - idle: 0
 * - paused: accumulatedMs
 * - running: accumulatedMs + (now - startedAt) [clamped at 0]
 */
export function computeElapsed(state, now) {
  if (!state) return 0;
  const {status, startedAt, accumulatedMs} = state;
  const base = Number.isFinite(accumulatedMs) ? Math.max(0, accumulatedMs) : 0;
  if (status === STATUS.RUNNING && typeof startedAt === 'number') {
    const delta = now - startedAt;
    return base + (delta > 0 ? delta : 0);
  }
  if (status === STATUS.PAUSED) {
    return base;
  }
  return 0;
}

/**
 * Lap delta = currentElapsed - lastLapTotalElapsed (or currentElapsed for the
 * first lap). Negative results clamp to 0.
 */
export function lapDelta(currentElapsed, lastLapTotalElapsed) {
  const last = Number.isFinite(lastLapTotalElapsed) ? lastLapTotalElapsed : 0;
  const cur = Number.isFinite(currentElapsed) ? currentElapsed : 0;
  const d = cur - last;
  return d > 0 ? d : 0;
}
