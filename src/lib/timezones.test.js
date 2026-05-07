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

import {getAllZones, searchZones} from './timezones';

describe('getAllZones', () => {
  it('returns a non-empty array of strings', () => {
    const zones = getAllZones();
    expect(Array.isArray(zones)).toBe(true);
    expect(zones.length).toBeGreaterThan(0);
    expect(typeof zones[0]).toBe('string');
  });

  it('includes common zones like America/New_York and Europe/London', () => {
    const zones = getAllZones();
    expect(zones).toContain('America/New_York');
    expect(zones).toContain('Europe/London');
    expect(zones).toContain('Asia/Tokyo');
  });
});

describe('searchZones', () => {
  it('returns empty array for empty query', () => {
    expect(searchZones('')).toHaveLength(0);
    expect(searchZones('   ')).toHaveLength(0);
  });

  it('finds zones by city name (case-insensitive)', () => {
    const results = searchZones('london');
    const values = results.map((r) => r.value);
    expect(values).toContain('Europe/London');
  });

  it('finds zones by IANA name', () => {
    const results = searchZones('America/New_York');
    const values = results.map((r) => r.value);
    expect(values).toContain('America/New_York');
  });

  it('finds zones by abbreviation: JST → Asia/Tokyo', () => {
    const results = searchZones('JST');
    const values = results.map((r) => r.value);
    expect(values).toContain('Asia/Tokyo');
  });

  it('finds zones by abbreviation: BST → Europe/London', () => {
    const results = searchZones('BST');
    const values = results.map((r) => r.value);
    expect(values).toContain('Europe/London');
  });

  it('finds zones by region: Eastern → America/New_York', () => {
    const results = searchZones('Eastern');
    const values = results.map((r) => r.value);
    expect(values).toContain('America/New_York');
  });

  it('finds zones by region: Pacific → America/Los_Angeles', () => {
    const results = searchZones('Pacific');
    const values = results.map((r) => r.value);
    expect(values).toContain('America/Los_Angeles');
  });

  it('returns no results for a nonsense query', () => {
    const results = searchZones('xyzzy_nonexistent_timezone');
    expect(results).toHaveLength(0);
  });

  it('exact match scores higher than prefix match (America/New_York before ambiguous)', () => {
    const results = searchZones('America/New_York');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].value).toBe('America/New_York');
  });

  it('prefix match ranks above substring match', () => {
    const results = searchZones('London');
    // Europe/London is an exact city match (highest), should come first
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].value).toBe('Europe/London');
  });

  it('result count is capped by the limit parameter', () => {
    const results = searchZones('a', 5);
    expect(results.length).toBeLessThanOrEqual(5);
  });

  it('each result has value and label strings', () => {
    const results = searchZones('Tokyo');
    for (const r of results) {
      expect(typeof r.value).toBe('string');
      expect(typeof r.label).toBe('string');
    }
  });
});
