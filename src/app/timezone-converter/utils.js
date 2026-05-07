// Time Zone Converter — Luxon-based pure helpers.

import {DateTime} from 'luxon';

/** Resolve our zone-id string to whatever Luxon expects. */
export function resolveZone(zone) {
  if (zone === 'utc') return 'utc';
  return zone; // IANA name
}

/**
 * Parse a "datetime-local"-shaped string ("2024-01-15T12:34") into a Luxon
 * DateTime in the given zone.
 *
 * Returns null when the input is empty or invalid.
 *
 * Returns an object {dt, normalized, normalizedTo} when valid:
 *   - dt          — the resulting DateTime
 *   - normalized  — true if Luxon silently shifted the wall-clock time (spring-forward DST gap)
 *   - normalizedTo — the adjusted time string ("yyyy-LL-dd'T'HH:mm"), or null when not normalized
 *
 * Note: fall-back ambiguity (fold, e.g. 2024-11-03T01:30 in America/New_York)
 * is silently resolved to the pre-fold occurrence (first offset). This is
 * Luxon's default behaviour. A future version may surface a disambiguation hint.
 */
export function parseLocalInput(input, zone) {
  if (typeof input !== 'string' || input.trim() === '') return null;
  const z = resolveZone(zone);
  const dt = DateTime.fromISO(input, {zone: z});
  if (!dt.isValid) return null;
  // Detect spring-forward gap: Luxon silently rolls forward to a valid moment.
  const echoed = dt.toFormat("yyyy-LL-dd'T'HH:mm");
  const normalized = echoed !== input;
  return {dt, normalized, normalizedTo: normalized ? echoed : null};
}

/** Convert a DateTime to a value suitable for `<input type="datetime-local">`. */
export function toLocalInput(dt) {
  if (!dt || !dt.isValid) return '';
  // Luxon's toFormat with the canonical pattern; trims to minutes.
  return dt.toFormat("yyyy-LL-dd'T'HH:mm");
}

/** Convert a DateTime to its representation in `zone`. */
export function reZone(dt, zone) {
  if (!dt || !dt.isValid) return null;
  return dt.setZone(resolveZone(zone));
}

/**
 * Build the per-zone display struct for one target.
 *
 *   {zone, dateTime, offsetLabel, abbreviation, weekday}
 *
 * `offsetLabel` is e.g. "+09:00", `abbreviation` is e.g. "JST" / "UTC" / "GMT+9".
 * `weekday` is the localized weekday name (e.g. "Tue") so the user can spot
 * day-of-week shifts across zones.
 */
export function buildZoneRow(anchorDt, zone) {
  if (!anchorDt || !anchorDt.isValid) {
    return {zone, valid: false, formatted: '', offsetLabel: '', abbreviation: '', weekday: ''};
  }
  const dt = anchorDt.setZone(resolveZone(zone));
  return {
    zone,
    valid: true,
    formatted: dt.toFormat('yyyy-LL-dd HH:mm'),
    offsetLabel: dt.toFormat('ZZ'),
    abbreviation: dt.toFormat('ZZZZ'),
    weekday: dt.toFormat('ccc'),
  };
}

/** Snap a DateTime to "now" in the requested zone. */
export function nowInZone(zone) {
  return DateTime.now().setZone(resolveZone(zone));
}
