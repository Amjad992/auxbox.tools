import {describe, it, expect} from 'vitest';
import {
  secureRandomInt,
  pickFromAlphabet,
  stripAmbiguous,
  buildAlphabets,
  generatePassword,
  estimateEntropyBits,
  strengthBucket,
} from './utils';
import {AMBIGUOUS, CHARS, DEFAULT_SETTINGS} from './constants';

describe('secureRandomInt', () => {
  it('throws on non-positive or non-integer max', () => {
    expect(() => secureRandomInt(0)).toThrow(RangeError);
    expect(() => secureRandomInt(-1)).toThrow(RangeError);
    expect(() => secureRandomInt(1.5)).toThrow(RangeError);
  });

  it('returns values strictly less than max', () => {
    for (let i = 0; i < 200; i++) {
      const v = secureRandomInt(10);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(10);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it('with max=1 always returns 0', () => {
    for (let i = 0; i < 20; i++) {
      expect(secureRandomInt(1)).toBe(0);
    }
  });
});

describe('pickFromAlphabet', () => {
  it('throws on empty alphabet', () => {
    expect(() => pickFromAlphabet('')).toThrow(RangeError);
  });

  it('returns only characters from the alphabet', () => {
    const alpha = 'abc';
    for (let i = 0; i < 50; i++) {
      expect(alpha).toContain(pickFromAlphabet(alpha));
    }
  });
});

describe('stripAmbiguous', () => {
  it('removes every ambiguous character', () => {
    const input = CHARS.upper + CHARS.lower + CHARS.digits;
    const out = stripAmbiguous(input);
    for (const ch of AMBIGUOUS) {
      expect(out).not.toContain(ch);
    }
  });

  it('leaves non-ambiguous characters intact', () => {
    expect(stripAmbiguous('abc234')).toBe('abc234');
  });

  it('handles empty input', () => {
    expect(stripAmbiguous('')).toBe('');
  });
});

describe('buildAlphabets', () => {
  it('returns only enabled classes', () => {
    const {classes, pool} = buildAlphabets({
      upper: true,
      lower: false,
      digits: true,
      symbols: false,
      excludeAmbiguous: false,
    });
    expect(classes).toHaveLength(2);
    expect(pool).toBe(CHARS.upper + CHARS.digits);
  });

  it('respects excludeAmbiguous', () => {
    const {pool} = buildAlphabets({
      upper: true,
      lower: true,
      digits: true,
      symbols: false,
      excludeAmbiguous: true,
    });
    for (const ch of AMBIGUOUS) {
      expect(pool).not.toContain(ch);
    }
  });

  it('reduces the class pool when excludeAmbiguous removes characters', () => {
    // With only uppercase enabled and excludeAmbiguous=true, O and I are
    // stripped. No full class is eliminated by the current AMBIGUOUS set.
    const {classes, pool} = buildAlphabets({
      upper: true,
      lower: false,
      digits: false,
      symbols: false,
      excludeAmbiguous: true,
    });
    expect(classes).toHaveLength(1);
    expect(pool.length).toBe(CHARS.upper.length - 2); // O, I removed
  });

  it('returns empty when no classes selected', () => {
    const {classes, pool} = buildAlphabets({
      upper: false,
      lower: false,
      digits: false,
      symbols: false,
      excludeAmbiguous: false,
    });
    expect(classes).toHaveLength(0);
    expect(pool).toBe('');
  });
});

describe('generatePassword', () => {
  it('returns a string of the requested length', () => {
    const pw = generatePassword({...DEFAULT_SETTINGS, length: 24});
    expect(pw).toHaveLength(24);
  });

  it('accepts the minimum boundary length of 6', () => {
    expect(generatePassword({...DEFAULT_SETTINGS, length: 6})).toHaveLength(6);
  });

  it('accepts the maximum boundary length of 64', () => {
    expect(generatePassword({...DEFAULT_SETTINGS, length: 64})).toHaveLength(64);
  });

  it('throws when no classes are selected', () => {
    expect(() =>
      generatePassword({
        length: 16,
        upper: false,
        lower: false,
        digits: false,
        symbols: false,
        excludeAmbiguous: false,
      })
    ).toThrow(/character class/);
  });

  it.each([5, 65, 0, -1, 16.5, 'x'])(
    'rejects invalid length: %p',
    (length) => {
      expect(() =>
        generatePassword({...DEFAULT_SETTINGS, length})
      ).toThrow(RangeError);
    }
  );

  it('contains at least one character from every selected class', () => {
    const settings = {
      length: 12,
      upper: true,
      lower: true,
      digits: true,
      symbols: true,
      excludeAmbiguous: false,
    };
    // Run many times — odds of accidentally satisfying this for a buggy
    // implementation are low but not zero, so iterate.
    for (let i = 0; i < 30; i++) {
      const pw = generatePassword(settings);
      expect(pw).toMatch(/[A-Z]/);
      expect(pw).toMatch(/[a-z]/);
      expect(pw).toMatch(/[0-9]/);
      expect(pw).toMatch(/[!@#$%^&*()\-_=+[\]{};:,.<>/?~]/);
    }
  });

  it('with excludeAmbiguous omits every ambiguous character', () => {
    const settings = {
      length: 32,
      upper: true,
      lower: true,
      digits: true,
      symbols: true,
      excludeAmbiguous: true,
    };
    for (let i = 0; i < 20; i++) {
      const pw = generatePassword(settings);
      for (const ch of AMBIGUOUS) {
        expect(pw).not.toContain(ch);
      }
    }
  });

  it('successive generations differ (probabilistic, length 24)', () => {
    const a = generatePassword({...DEFAULT_SETTINGS, length: 24});
    const b = generatePassword({...DEFAULT_SETTINGS, length: 24});
    expect(a).not.toBe(b);
  });

  it('uses every character of the pool over many runs (smoke)', () => {
    // Single class, short alphabet — over 200 chars total we expect to
    // see every letter at least once with overwhelming probability.
    const seen = new Set();
    for (let i = 0; i < 8; i++) {
      const pw = generatePassword({
        length: 32,
        upper: true,
        lower: false,
        digits: false,
        symbols: false,
        excludeAmbiguous: false,
      });
      for (const ch of pw) seen.add(ch);
    }
    expect(seen.size).toBeGreaterThanOrEqual(20); // 26 letters, allow slack
  });
});

describe('estimateEntropyBits', () => {
  it('is 0 when pool is too small or length is non-positive', () => {
    expect(estimateEntropyBits(10, 1)).toBe(0);
    expect(estimateEntropyBits(0, 26)).toBe(0);
    expect(estimateEntropyBits(NaN, 26)).toBe(0);
  });

  it('is 0 when length < number of forced classes', () => {
    // 5 forced classes but length 3 — degenerate.
    expect(estimateEntropyBits(3, 94, [26, 26, 10, 10, 32])).toBe(0);
  });

  it('with no class sizes, falls back to IID formula L * log2(N)', () => {
    expect(estimateEntropyBits(10, 2)).toBeCloseTo(10, 5);
    expect(estimateEntropyBits(8, 26)).toBeCloseTo(8 * Math.log2(26), 5);
  });

  it('when length === numClasses, entropy is sum of log2(classSize)', () => {
    // No free positions — all entropy comes from the forced slots.
    const classSizes = [26, 26, 10]; // upper + lower + digits
    const expected = Math.log2(26) + Math.log2(26) + Math.log2(10);
    expect(estimateEntropyBits(3, 62, classSizes)).toBeCloseTo(expected, 5);
  });

  it('when length > numClasses, free positions add pool-size entropy', () => {
    // length=10, 2 classes (26+26=52 pool), 8 free positions.
    const classSizes = [26, 26];
    const poolSize = 52;
    const expected = Math.log2(26) + Math.log2(26) + 8 * Math.log2(poolSize);
    expect(estimateEntropyBits(10, poolSize, classSizes)).toBeCloseTo(expected, 5);
  });

  it('grows with both length and pool', () => {
    expect(estimateEntropyBits(16, 26)).toBeLessThan(
      estimateEntropyBits(32, 26)
    );
    expect(estimateEntropyBits(16, 26)).toBeLessThan(
      estimateEntropyBits(16, 94)
    );
  });
});

describe('strengthBucket', () => {
  it('bucket boundaries climb monotonically', () => {
    const labels = [0, 36, 60, 80, 112].map((b) => strengthBucket(b).label);
    expect(labels).toEqual([
      'Very weak',
      'Weak',
      'Fair',
      'Strong',
      'Very strong',
    ]);
  });

  it('values just below a boundary stay in the lower bucket', () => {
    expect(strengthBucket(35.9).label).toBe('Very weak');
    expect(strengthBucket(59.9).label).toBe('Weak');
    expect(strengthBucket(79.9).label).toBe('Fair');
    expect(strengthBucket(111.9).label).toBe('Strong');
  });

  it('treats non-finite input as 0', () => {
    expect(strengthBucket(NaN).label).toBe('Very weak');
    expect(strengthBucket(Infinity).label).toBe('Very weak');
  });
});
