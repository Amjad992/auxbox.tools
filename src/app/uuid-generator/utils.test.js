import {describe, it, expect} from 'vitest';
import {generateBatch, generateV4, generateV7, isValidUuid} from './utils';
import {TYPES} from './constants';

describe('generateV4', () => {
  it('matches the v4 format', () => {
    for (let i = 0; i < 50; i++) {
      const id = generateV4();
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      );
    }
  });

  it('produces unique values', () => {
    const set = new Set();
    for (let i = 0; i < 1000; i++) set.add(generateV4());
    expect(set.size).toBe(1000);
  });
});

describe('generateV7', () => {
  it('matches the v7 format (version nibble = 7, variant = 10)', () => {
    for (let i = 0; i < 50; i++) {
      const id = generateV7();
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      );
    }
  });

  it('encodes the timestamp prefix in the leading 48 bits', () => {
    const before = Date.now();
    const id = generateV7();
    const after = Date.now();
    // First 12 hex chars (48 bits) = unix-ms timestamp.
    const tsHex = id.replaceAll('-', '').slice(0, 12);
    const ts = parseInt(tsHex, 16);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it('generates timestamp-ordered IDs across calls in different ms', async () => {
    const a = generateV7();
    await new Promise((r) => setTimeout(r, 5));
    const b = generateV7();
    // Lexicographic ordering follows the timestamp prefix.
    expect(a < b).toBe(true);
  });

  it('produces unique values within a single ms', () => {
    const set = new Set();
    for (let i = 0; i < 1000; i++) set.add(generateV7());
    expect(set.size).toBe(1000);
  });
});

describe('generateBatch', () => {
  it('returns N v4 UUIDs', () => {
    const batch = generateBatch(TYPES.V4, 5);
    expect(batch).toHaveLength(5);
    batch.forEach((id) => expect(isValidUuid(id)).toBe(true));
  });

  it('returns N v7 UUIDs', () => {
    const batch = generateBatch(TYPES.V7, 5);
    expect(batch).toHaveLength(5);
    batch.forEach((id) => expect(isValidUuid(id)).toBe(true));
  });

  it('clamps non-positive counts to zero', () => {
    expect(generateBatch(TYPES.V4, 0)).toEqual([]);
    expect(generateBatch(TYPES.V4, -5)).toEqual([]);
    expect(generateBatch(TYPES.V4, NaN)).toEqual([]);
  });

  it('floors fractional counts', () => {
    expect(generateBatch(TYPES.V4, 2.7)).toHaveLength(2);
  });

  it('coerces string counts', () => {
    expect(generateBatch(TYPES.V4, '3')).toHaveLength(3);
  });
});

describe('randomBytes (via generateV4) — fails loud when crypto.getRandomValues is missing', () => {
  it('throws if crypto.getRandomValues is unavailable', () => {
    const original = globalThis.crypto;
    // Force the missing-crypto branch.
    Object.defineProperty(globalThis, 'crypto', {
      value: undefined,
      configurable: true,
    });
    try {
      // generateV4's primary path uses randomUUID; force the secondary
      // path by also pretending randomUUID is missing.
      expect(() => generateV4()).toThrow(/crypto\.getRandomValues/i);
      expect(() => generateV7()).toThrow(/crypto\.getRandomValues/i);
    } finally {
      Object.defineProperty(globalThis, 'crypto', {
        value: original,
        configurable: true,
      });
    }
  });
});

describe('isValidUuid', () => {
  it('accepts well-formed v4 and v7', () => {
    expect(isValidUuid(generateV4())).toBe(true);
    expect(isValidUuid(generateV7())).toBe(true);
  });

  it('rejects malformed strings', () => {
    expect(isValidUuid('')).toBe(false);
    expect(isValidUuid('not-a-uuid')).toBe(false);
    expect(isValidUuid('00000000-0000-0000-0000-000000000000')).toBe(false); // version=0
    expect(isValidUuid('00000000-0000-3000-8000-000000000000')).toBe(false); // version=3 not in allowed set
  });
});
