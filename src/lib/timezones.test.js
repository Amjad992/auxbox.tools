import {describe, it, expect} from 'vitest';
import {ZONE_OPTIONS, ZONE_VALUES} from './timezones';

describe('ZONE_OPTIONS', () => {
  it('has 20 entries', () => {
    expect(ZONE_OPTIONS).toHaveLength(20);
  });

  it('every entry has a string value and a string label', () => {
    for (const z of ZONE_OPTIONS) {
      expect(typeof z.value).toBe('string');
      expect(typeof z.label).toBe('string');
      expect(z.value.length).toBeGreaterThan(0);
      expect(z.label.length).toBeGreaterThan(0);
    }
  });

  it('all values appear exactly once (no duplicates)', () => {
    const seen = new Set();
    for (const z of ZONE_OPTIONS) {
      expect(seen.has(z.value)).toBe(false);
      seen.add(z.value);
    }
  });
});

describe('ZONE_VALUES', () => {
  it('matches the values extracted from ZONE_OPTIONS', () => {
    expect(ZONE_VALUES).toEqual(ZONE_OPTIONS.map((z) => z.value));
  });

  it('Asia/Riyadh label contains disambiguation text', () => {
    const riyadh = ZONE_OPTIONS.find((z) => z.value === 'Asia/Riyadh');
    expect(riyadh).toBeDefined();
    expect(riyadh.label).toMatch(/Arabia/i);
  });
});
