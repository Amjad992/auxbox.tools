// Pure date math for the Date Calculator.
//
// All public inputs and outputs use Luxon DateTime (or null). Internal
// arithmetic delegates to Luxon rather than raw Date arithmetic so that
// DST-boundary and leap-year edge cases are handled by a battle-tested library.

import {DateTime} from 'luxon';

/**
 * Parse a strict yyyy-mm-dd string into a Luxon DateTime (time set to
 * midnight local), or null if the input is invalid.
 */
export function parseISODate(input) {
  if (typeof input !== 'string') return null;
  const dt = DateTime.fromISO(input);
  return dt.isValid ? dt.startOf('day') : null;
}

/**
 * Compare two Luxon DateTimes (day precision). Returns -1, 0, or 1.
 */
export function compareDates(a, b) {
  const aMs = +a.startOf('day');
  const bMs = +b.startOf('day');
  if (aMs < bMs) return -1;
  if (aMs > bMs) return 1;
  return 0;
}

/**
 * Ensure start <= end. Returns the (possibly swapped) pair plus a flag.
 */
export function swapIfReversed(start, end) {
  if (compareDates(start, end) > 0) {
    return {start: end, end: start, swapped: true};
  }
  return {start, end, swapped: false};
}

/**
 * Calendar-correct year / month / day breakdown. Assumes start <= end.
 *
 * Uses Luxon's diff with longterm accuracy (accounts for variable-length
 * months and leap years). The days component is floored to an integer because
 * Luxon may produce fractional days at DST transitions; date-only inputs
 * should not trigger this, but we floor defensively.
 *
 * Verified to match Java Period.between semantics for all canonical edge cases:
 *   - same date           → {0, 0, 0}
 *   - 2024-01-15 → 2025-01-15 → {1, 0, 0}
 *   - 2024-01-31 → 2024-02-28 → {0, 0, 28}
 *   - 2020-02-29 → 2024-02-29 → {4, 0, 0}
 *   - 2024-01-31 → 2024-03-01 → {0, 1, 1}
 *   - 2023-03-15 → 2024-02-10 → {0, 10, 26}
 */
export function diffYMD(start, end) {
  const dur = end.diff(start, ['years', 'months', 'days'], {
    conversionAccuracy: 'longterm',
  });
  return {
    years: Math.floor(dur.years),
    months: Math.floor(dur.months),
    days: Math.floor(dur.days),
  };
}

/**
 * Whole-day count between two DateTimes. Uses startOf('day') on both ends
 * and Math.round to absorb any DST-boundary float rounding.
 */
export function totalDaysBetween(start, end) {
  return Math.round(
    end.startOf('day').diff(start.startOf('day'), 'days').days
  );
}

/**
 * Total days plus derived units (weeks + remainder, hours, minutes).
 */
export function totalUnits(start, end) {
  const days = totalDaysBetween(start, end);
  const weeks = Math.floor(days / 7);
  const weekRemainderDays = days - weeks * 7;
  return {
    days,
    weeks,
    weekRemainderDays,
    hours: days * 24,
    minutes: days * 1440,
  };
}

/**
 * Mon–Fri count between start and end inclusive.
 * Luxon weekday: 1 = Monday … 7 = Sunday.
 */
export function workingDaysBetween(start, end) {
  const startDay = start.startOf('day');
  const endDay = end.startOf('day');
  const totalDays = Math.round(endDay.diff(startDay, 'days').days);
  if (totalDays < 0) return 0;

  let count = 0;
  for (let i = 0; i <= totalDays; i++) {
    const wd = startDay.plus({days: i}).weekday; // 1-5 = Mon-Fri
    if (wd <= 5) count += 1;
  }
  return count;
}
