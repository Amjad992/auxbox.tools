// Timestamp Converter — pure helpers. Luxon-based per the project rule.

import {DateTime} from 'luxon';
import {ZONE_LOCAL, ZONE_UTC} from './constants';

/** Resolve a zone-id string to whatever Luxon expects. */
function resolveZone(zone) {
  if (zone === ZONE_UTC) return 'utc';
  if (zone === ZONE_LOCAL) return undefined; // Luxon's default = system local
  return zone; // IANA name like 'Europe/Berlin'
}

/**
 * Best-effort parser. Accepts:
 *   - integer string with auto-magnitude detection:
 *       <= 10 digits → seconds, 11-13 → milliseconds.
 *   - integer Number with the same rule.
 *   - ISO 8601 string.
 *   - free-form date string (Luxon's `fromRFC2822`/`fromHTTP` aren't tried;
 *     we stick to ISO + numeric only to keep the contract clear).
 *
 * Returns a DateTime or null when the input can't be parsed.
 */
export function parseAny(raw) {
  if (raw == null) return null;
  if (raw instanceof DateTime) return raw.isValid ? raw : null;
  const s = typeof raw === 'string' ? raw.trim() : raw;
  if (s === '' || s === null || s === undefined) return null;

  // Numeric branch.
  if (typeof s === 'number' || /^-?\d+$/.test(String(s))) {
    const n = Number(s);
    if (!Number.isFinite(n)) return null;
    const abs = Math.abs(n);
    // Heuristic: 13+ digits is ms; 10 or fewer is seconds. (10 digits =
    // up to 9999999999 = year 2286, comfortably the second range.)
    const looksLikeMs = abs >= 1e11;
    const dt = looksLikeMs
      ? DateTime.fromMillis(n)
      : DateTime.fromSeconds(n);
    if (!dt.isValid) return null;
    if (dt.year < -9999 || dt.year > 9999) return null;
    return dt;
  }

  // ISO branch.
  if (typeof s === 'string') {
    const iso = DateTime.fromISO(s, {setZone: true});
    if (iso.isValid) return iso;
  }
  return null;
}

export function toUnixSeconds(dt) {
  if (!dt || !dt.isValid) return null;
  return Math.floor(dt.toMillis() / 1000);
}

export function toUnixMillis(dt) {
  if (!dt || !dt.isValid) return null;
  return dt.toMillis();
}

export function toIso(dt, zone) {
  if (!dt || !dt.isValid) return '';
  const z = resolveZone(zone);
  const out = z ? dt.setZone(z) : dt.toLocal();
  return out.toISO({suppressMilliseconds: false}) ?? '';
}

export function toHumanLocal(dt, zone) {
  if (!dt || !dt.isValid) return '';
  const z = resolveZone(zone);
  const out = z ? dt.setZone(z) : dt.toLocal();
  return out.toLocaleString({
    dateStyle: 'medium',
    timeStyle: 'long',
  });
}

/** Compose all four representations of `dt` for the UI. */
export function buildAllRepresentations(dt, zone) {
  return {
    iso: toIso(dt, zone),
    seconds: toUnixSeconds(dt),
    millis: toUnixMillis(dt),
    human: toHumanLocal(dt, zone),
  };
}
