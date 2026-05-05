// Pure helpers around `cronstrue` (description) and `cron-parser` (iteration).
// All wall-clock formatting goes through Luxon — see the Luxon-everywhere
// project rule. `cron-parser` returns native Date instances; we convert at
// the boundary via `DateTime.fromJSDate()`.

import {DateTime} from 'luxon';
import cronstrue from 'cronstrue';
import {CronExpressionParser} from 'cron-parser';

/**
 * Returns `{valid: boolean, error?: string}` for a cron expression.
 * Trims whitespace before parsing; an empty string is treated as invalid
 * (no expression to evaluate) but with no user-facing error message.
 */
export function parseExpression(src) {
  const trimmed = typeof src === 'string' ? src.trim() : '';
  if (!trimmed) return {valid: false};
  try {
    CronExpressionParser.parse(trimmed);
    return {valid: true};
  } catch (err) {
    const msg = err && err.message ? String(err.message) : 'Invalid cron expression';
    return {valid: false, error: msg};
  }
}

/**
 * Returns the human-readable English description, or `null` if parsing
 * fails. Uses `cronstrue` with `throwExceptionOnParseError: false`, then
 * verifies the expression is actually parseable (because cronstrue returns
 * an "An error occurred ..." string for bad input rather than throwing).
 */
export function describe(src) {
  const trimmed = typeof src === 'string' ? src.trim() : '';
  if (!trimmed) return null;
  // Gate on cron-parser first — cronstrue's internal parser is more lenient
  // and would accept some inputs that cron-parser rejects.
  if (!parseExpression(trimmed).valid) return null;
  try {
    const out = cronstrue.toString(trimmed, {
      throwExceptionOnParseError: false,
    });
    if (typeof out !== 'string' || out.length === 0) return null;
    if (/^an error occurred/i.test(out)) return null;
    return out;
  } catch {
    return null;
  }
}

/**
 * Returns up to `count` upcoming fire times for the given expression,
 * starting from `fromDate` (default now).
 *
 * Each entry: `{jsDate, dt, isoString, absoluteLabel, relativeLabel}`.
 * - `jsDate`   — native Date (boundary value from cron-parser).
 * - `dt`       — Luxon DateTime in the local zone.
 * - `isoString`— `dt.toISO()` (stable test key).
 * - `absoluteLabel` — DATETIME_MED_WITH_WEEKDAY (e.g. "Mon, Aug 11, 2025, 9:00 AM").
 * - `relativeLabel` — DateTime.toRelative({base}) (e.g. "in 2 days").
 *
 * Returns `[]` for invalid input.
 */
export function nextRuns(src, count = 5, fromDate = new Date()) {
  const trimmed = typeof src === 'string' ? src.trim() : '';
  if (!trimmed) return [];
  const wanted = Math.max(0, Math.min(50, Number(count) || 0));
  if (wanted === 0) return [];
  let interval;
  try {
    interval = CronExpressionParser.parse(trimmed, {currentDate: fromDate});
  } catch {
    return [];
  }
  const baseDt = DateTime.fromJSDate(fromDate);
  const out = [];
  for (let i = 0; i < wanted; i += 1) {
    let next;
    try {
      next = interval.next();
    } catch {
      // No more matches in cron-parser's range — stop early.
      break;
    }
    const jsDate = next.toDate();
    const dt = DateTime.fromJSDate(jsDate);
    out.push({
      jsDate,
      dt,
      isoString: dt.toISO(),
      absoluteLabel: dt.toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY),
      relativeLabel: dt.toRelative({base: baseDt}) || '',
    });
  }
  return out;
}
