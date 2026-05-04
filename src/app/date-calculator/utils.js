// Pure date math for the Age / Date Difference Calculator.
//
// All inputs/outputs use a {year, month, day} record (month is 1-indexed).
// Arithmetic is performed on YMD parts, not timestamps, to dodge DST/time-zone
// surprises. Where day counts cross potential DST boundaries we use Date.UTC
// (which has no DST) and round to the nearest day.

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Days in a given (1-indexed) month, taking leap years into account.
 */
export function daysInMonth(year, month) {
  if (month === 2) {
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return isLeap ? 29 : 28;
  }
  if (month === 4 || month === 6 || month === 9 || month === 11) return 30;
  return 31;
}

/**
 * Parse a strict yyyy-mm-dd string into {year, month, day}, or null if the
 * input is malformed or the date is impossible (e.g. Feb 30, Feb 29 in a
 * non-leap year).
 */
export function parseISODate(input) {
  if (typeof input !== 'string') return null;
  const m = ISO_RE.exec(input);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(year, month)) return null;
  return {year, month, day};
}

/**
 * Compare two YMD records lexicographically. Returns -1, 0, or 1.
 */
export function compareDates(a, b) {
  if (a.year !== b.year) return a.year < b.year ? -1 : 1;
  if (a.month !== b.month) return a.month < b.month ? -1 : 1;
  if (a.day !== b.day) return a.day < b.day ? -1 : 1;
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
 * Add `monthsToAdd` whole calendar months to a YMD record. If the target
 * month has fewer days than `start.day` the result is clamped to the last
 * day of the target month (matches Java's LocalDate.plusMonths). Used by
 * diffYMD to compute the "anchor" date one month before `end`.
 */
function addMonths(start, monthsToAdd) {
  // Convert (year, month) to a 0-based "absolute month" index, add, decode.
  const totalMonths = start.year * 12 + (start.month - 1) + monthsToAdd;
  const year = Math.floor(totalMonths / 12);
  const month = (totalMonths % 12 + 12) % 12 + 1;
  const day = Math.min(start.day, daysInMonth(year, month));
  return {year, month, day};
}

/**
 * Calendar-correct year / month / day breakdown. Assumes start <= end.
 *
 * Algorithm (matches Java's Period.between):
 *   1. totalMonths = (end.year - start.year) * 12 + (end.month - start.month)
 *   2. days = end.day - start.day
 *   3. If days < 0, decrement totalMonths and re-anchor: days = totalDays
 *      between (start + totalMonths months) and end.
 *   4. years = totalMonths / 12, months = totalMonths % 12.
 *
 * Worked examples this handles correctly:
 *   - 2024-01-15 -> 2025-01-15  -> {1, 0, 0}
 *   - 2024-01-31 -> 2024-02-28  -> {0, 0, 28}
 *   - 2024-01-31 -> 2024-03-01  -> {0, 1, 1}  (canonical edge — needs the
 *                                              clamping addMonths)
 *   - 2020-02-29 -> 2024-02-29  -> {4, 0, 0}
 *   - 2023-03-15 -> 2024-02-10  -> {0, 10, 26}
 */
export function diffYMD(start, end) {
  let totalMonths = (end.year - start.year) * 12 + (end.month - start.month);
  let days = end.day - start.day;

  if (days < 0) {
    totalMonths -= 1;
    const anchor = addMonths(start, totalMonths);
    days = totalDaysBetween(anchor, end);
  }

  const years = Math.trunc(totalMonths / 12);
  const months = totalMonths - years * 12;
  return {years, months, days};
}

/**
 * Whole-day count between two YMD records using UTC midnight to dodge DST.
 * Always returns a non-negative integer when start <= end.
 */
export function totalDaysBetween(start, end) {
  const startUTC = Date.UTC(start.year, start.month - 1, start.day);
  const endUTC = Date.UTC(end.year, end.month - 1, end.day);
  return Math.round((endUTC - startUTC) / 86_400_000);
}

/**
 * Total days plus derived units (weeks + remainder, hours, minutes).
 * Hours/minutes are exact integer multiples by construction (24h per day).
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
 * Mon-Fri count between start and end inclusive. Implemented as a loop on the
 * day-of-week of each date in the range — clear and safe for the spans this
 * tool handles. A closed-form is possible but not yet justified.
 */
export function workingDaysBetween(start, end) {
  const startUTC = Date.UTC(start.year, start.month - 1, start.day);
  const endUTC = Date.UTC(end.year, end.month - 1, end.day);
  if (endUTC < startUTC) return 0;

  let count = 0;
  for (let t = startUTC; t <= endUTC; t += 86_400_000) {
    const dow = new Date(t).getUTCDay(); // 0 = Sun, 6 = Sat
    if (dow !== 0 && dow !== 6) count += 1;
  }
  return count;
}
