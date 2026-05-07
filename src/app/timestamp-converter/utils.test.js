import {describe, it, expect} from 'vitest';
import {DateTime} from 'luxon';
import {
  buildAllRepresentations,
  parseAny,
  toIso,
  toUnixMillis,
  toUnixSeconds,
} from './utils';
import {ZONE_LOCAL, ZONE_UTC} from './constants';

describe('parseAny', () => {
  it('returns null for empty / nullish input', () => {
    expect(parseAny('')).toBeNull();
    expect(parseAny('   ')).toBeNull();
    expect(parseAny(null)).toBeNull();
    expect(parseAny(undefined)).toBeNull();
  });

  it('detects 10-digit numeric as Unix seconds', () => {
    const dt = parseAny('1700000000');
    expect(dt).not.toBeNull();
    expect(toUnixSeconds(dt)).toBe(1700000000);
  });

  it('detects 13-digit numeric as Unix milliseconds', () => {
    const dt = parseAny('1700000000000');
    expect(dt).not.toBeNull();
    expect(toUnixMillis(dt)).toBe(1700000000000);
  });

  it('parses ISO 8601', () => {
    const dt = parseAny('2024-01-15T12:34:56Z');
    expect(dt).not.toBeNull();
    expect(toUnixSeconds(dt)).toBe(
      DateTime.fromISO('2024-01-15T12:34:56Z').toUnixInteger()
    );
  });

  it('handles negative seconds (pre-1970)', () => {
    const dt = parseAny('-100000');
    expect(dt).not.toBeNull();
    expect(toUnixSeconds(dt)).toBe(-100000);
  });

  it('rejects garbage', () => {
    expect(parseAny('abc')).toBeNull();
    expect(parseAny('2024-99-99')).toBeNull();
  });

  it('accepts numeric input directly (not just strings)', () => {
    const dt = parseAny(1700000000);
    expect(toUnixSeconds(dt)).toBe(1700000000);
  });
});

describe('toIso / toUnixSeconds / toUnixMillis', () => {
  const dt = DateTime.fromISO('2024-06-15T10:30:00.000Z');

  it('round-trips ISO', () => {
    const iso = toIso(dt, ZONE_UTC);
    expect(iso.startsWith('2024-06-15T10:30:00.000')).toBe(true);
  });

  it('seconds + ms agree', () => {
    expect(toUnixMillis(dt)).toBe(toUnixSeconds(dt) * 1000);
  });

  it('returns empty / null for invalid input', () => {
    expect(toIso(null, ZONE_UTC)).toBe('');
    expect(toUnixSeconds(null)).toBeNull();
    expect(toUnixMillis(null)).toBeNull();
  });

  it('respects the requested zone for ISO output', () => {
    const utc = toIso(dt, ZONE_UTC);
    const ny = toIso(dt, 'America/New_York');
    // Same instant, different offset; the date-time strings differ.
    expect(utc).not.toBe(ny);
    // Both parse back to the same instant.
    expect(DateTime.fromISO(utc).toMillis()).toBe(
      DateTime.fromISO(ny, {setZone: true}).toMillis()
    );
  });
});

describe('buildAllRepresentations', () => {
  it('returns iso, seconds, millis, human for a valid DateTime', () => {
    const dt = DateTime.fromMillis(1700000000000);
    const r = buildAllRepresentations(dt, ZONE_UTC);
    expect(typeof r.iso).toBe('string');
    expect(r.iso.length).toBeGreaterThan(0);
    expect(r.seconds).toBe(1700000000);
    expect(r.millis).toBe(1700000000000);
    expect(typeof r.human).toBe('string');
    expect(r.human.length).toBeGreaterThan(0);
  });

  it('returns blanks for invalid input', () => {
    const r = buildAllRepresentations(null, ZONE_LOCAL);
    expect(r.iso).toBe('');
    expect(r.seconds).toBeNull();
    expect(r.millis).toBeNull();
    expect(r.human).toBe('');
  });
});
