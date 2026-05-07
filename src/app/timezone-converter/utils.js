// Time Zone Converter — Luxon-based pure helpers.

import {DateTime} from 'luxon';

/** Resolve our zone-id string to whatever Luxon expects. */
export function resolveZone(zone) {
  if (zone === 'utc') return 'utc';
  return zone; // IANA name
}

/**
 * Parse a "datetime-local"-shaped string ("2024-01-15T12:34") into a Luxon
 * DateTime in the given zone. Returns the DateTime or null when invalid.
 */
export function parseLocalInput(input, zone) {
  if (typeof input !== 'string' || input.trim() === '') return null;
  const z = resolveZone(zone);
  const dt = DateTime.fromISO(input, {zone: z});
  return dt.isValid ? dt : null;
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
