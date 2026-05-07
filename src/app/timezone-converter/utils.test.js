import {describe, it, expect} from 'vitest';
import {DateTime} from 'luxon';
import {
  buildZoneRow,
  nowInZone,
  parseLocalInput,
  reZone,
  resolveZone,
  toLocalInput,
} from './utils';

describe('resolveZone', () => {
  it("translates 'utc' to Luxon's 'utc' literal", () => {
    expect(resolveZone('utc')).toBe('utc');
  });

  it('passes IANA names through', () => {
    expect(resolveZone('Europe/Paris')).toBe('Europe/Paris');
  });
});

describe('parseLocalInput', () => {
  it('parses an ISO local string in the given zone', () => {
    const dt = parseLocalInput('2024-06-15T10:30', 'Europe/Berlin');
    expect(dt).not.toBeNull();
    expect(dt.zoneName).toBe('Europe/Berlin');
    expect(dt.year).toBe(2024);
    expect(dt.month).toBe(6);
    expect(dt.hour).toBe(10);
    expect(dt.minute).toBe(30);
  });

  it('returns null for empty/whitespace/garbage', () => {
    expect(parseLocalInput('', 'utc')).toBeNull();
    expect(parseLocalInput('  ', 'utc')).toBeNull();
    expect(parseLocalInput('not-a-date', 'utc')).toBeNull();
  });
});

describe('toLocalInput', () => {
  it('formats a DateTime as yyyy-MM-ddTHH:mm', () => {
    const dt = DateTime.fromObject(
      {year: 2024, month: 6, day: 15, hour: 10, minute: 30},
      {zone: 'utc'}
    );
    expect(toLocalInput(dt)).toBe('2024-06-15T10:30');
  });

  it('returns empty for invalid input', () => {
    expect(toLocalInput(null)).toBe('');
  });
});

describe('reZone', () => {
  it('preserves the instant while changing the zone', () => {
    const dt = DateTime.fromISO('2024-06-15T10:30:00Z', {setZone: true});
    const ny = reZone(dt, 'America/New_York');
    expect(ny.toUTC().toISO()).toBe(dt.toUTC().toISO());
    expect(ny.zoneName).toBe('America/New_York');
  });
});

describe('buildZoneRow', () => {
  it('renders formatted/offset/abbreviation/weekday for a valid anchor', () => {
    const dt = DateTime.fromISO('2024-06-15T10:30:00Z', {setZone: true});
    const row = buildZoneRow(dt, 'America/New_York');
    expect(row.valid).toBe(true);
    expect(row.formatted).toMatch(/^2024-06-15 \d{2}:\d{2}$/);
    expect(row.offsetLabel).toMatch(/^[+-]\d{2}:\d{2}$/);
    expect(typeof row.abbreviation).toBe('string');
    expect(typeof row.weekday).toBe('string');
  });

  it('returns valid:false for null anchor', () => {
    const row = buildZoneRow(null, 'America/New_York');
    expect(row.valid).toBe(false);
    expect(row.formatted).toBe('');
  });
});

describe('nowInZone', () => {
  it('returns a valid DateTime in the requested zone', () => {
    const dt = nowInZone('Asia/Tokyo');
    expect(dt.isValid).toBe(true);
    expect(dt.zoneName).toBe('Asia/Tokyo');
  });
});
