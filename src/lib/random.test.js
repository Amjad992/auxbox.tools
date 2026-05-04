import {describe, it, expect} from 'vitest';
import {secureRandomInt} from './random';

describe('secureRandomInt', () => {
  it('throws RangeError on non-positive max', () => {
    expect(() => secureRandomInt(0)).toThrow(RangeError);
    expect(() => secureRandomInt(-1)).toThrow(RangeError);
    expect(() => secureRandomInt(-100)).toThrow(RangeError);
  });

  it('throws RangeError on non-integer max', () => {
    expect(() => secureRandomInt(1.5)).toThrow(RangeError);
    expect(() => secureRandomInt(NaN)).toThrow(RangeError);
    expect(() => secureRandomInt(Infinity)).toThrow(RangeError);
    expect(() => secureRandomInt('5')).toThrow(RangeError);
    expect(() => secureRandomInt(undefined)).toThrow(RangeError);
  });

  it('with max=1 always returns 0', () => {
    for (let i = 0; i < 50; i++) {
      expect(secureRandomInt(1)).toBe(0);
    }
  });

  it('returns integers in [0, max) for max=10', () => {
    for (let i = 0; i < 500; i++) {
      const v = secureRandomInt(10);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(10);
    }
  });

  it('covers every value in the range over many iterations (smoke)', () => {
    const seen = new Set();
    for (let i = 0; i < 2000; i++) {
      seen.add(secureRandomInt(8));
    }
    expect(seen.size).toBe(8);
  });

  it('handles large max without bias-rejection looping forever', () => {
    // 2^31 — within uint32, exercises the rejection path on roughly half the
    // samples but still terminates quickly.
    for (let i = 0; i < 10; i++) {
      const v = secureRandomInt(2 ** 31);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(2 ** 31);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it('distribution is roughly uniform (chi-square smoke)', () => {
    // Not a strict statistical test — just catches gross modulo bias.
    const buckets = new Array(7).fill(0);
    const n = 7000;
    for (let i = 0; i < n; i++) buckets[secureRandomInt(7)]++;
    const expected = n / 7;
    // Allow a generous +/-25% per bucket; modulo bias would skew much harder.
    for (const c of buckets) {
      expect(c).toBeGreaterThan(expected * 0.75);
      expect(c).toBeLessThan(expected * 1.25);
    }
  });
});
