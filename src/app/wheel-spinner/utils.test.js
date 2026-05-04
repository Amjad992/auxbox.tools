import {describe, it, expect} from 'vitest';
import {
  parseEntries,
  pickWinnerIndex,
  removeEntryAt,
  quickPickSchedule,
  targetRotationFor,
  winnerFromRotation,
  buildPalette,
  slicePath,
} from './utils';

describe('parseEntries', () => {
  it('returns an empty array for empty/invalid input', () => {
    expect(parseEntries('')).toEqual([]);
    expect(parseEntries(undefined)).toEqual([]);
    expect(parseEntries(null)).toEqual([]);
    expect(parseEntries(42)).toEqual([]);
  });

  it('trims whitespace per line', () => {
    expect(parseEntries('  a  \n\tb\n  c\t')).toEqual(['a', 'b', 'c']);
  });

  it('drops blank lines', () => {
    expect(parseEntries('a\n\n\nb\n   \nc')).toEqual(['a', 'b', 'c']);
  });

  it('dedupes (first occurrence wins, case-sensitive)', () => {
    expect(parseEntries('Alice\nBob\nalice\nAlice')).toEqual([
      'Alice',
      'Bob',
      'alice',
    ]);
  });

  it('handles \\r\\n line endings', () => {
    expect(parseEntries('a\r\nb\r\nc')).toEqual(['a', 'b', 'c']);
  });
});

describe('pickWinnerIndex', () => {
  it('returns an integer in [0, n)', () => {
    for (let i = 0; i < 200; i++) {
      const v = pickWinnerIndex(7);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(7);
    }
  });

  it('with n=1 always returns 0', () => {
    expect(pickWinnerIndex(1)).toBe(0);
  });

  it('throws on invalid input', () => {
    expect(() => pickWinnerIndex(0)).toThrow(RangeError);
    expect(() => pickWinnerIndex(-1)).toThrow(RangeError);
    expect(() => pickWinnerIndex(1.5)).toThrow(RangeError);
  });
});

describe('removeEntryAt', () => {
  it('removes the entry at the given index', () => {
    expect(removeEntryAt(['a', 'b', 'c'], 1)).toEqual(['a', 'c']);
    expect(removeEntryAt(['a', 'b', 'c'], 0)).toEqual(['b', 'c']);
    expect(removeEntryAt(['a', 'b', 'c'], 2)).toEqual(['a', 'b']);
  });

  it('returns a copy unchanged for out-of-range indices', () => {
    const orig = ['a', 'b'];
    const out = removeEntryAt(orig, 5);
    expect(out).toEqual(['a', 'b']);
    expect(out).not.toBe(orig);
  });

  it('handles non-arrays defensively', () => {
    expect(removeEntryAt(null, 0)).toEqual([]);
    expect(removeEntryAt(undefined, 0)).toEqual([]);
  });

  it('does not mutate the input', () => {
    const orig = ['a', 'b', 'c'];
    removeEntryAt(orig, 1);
    expect(orig).toEqual(['a', 'b', 'c']);
  });
});

describe('quickPickSchedule', () => {
  it('throws on invalid n / winnerIndex / totalMs', () => {
    expect(() => quickPickSchedule(1, 0, 1500)).toThrow(RangeError);
    expect(() => quickPickSchedule(5, 5, 1500)).toThrow(RangeError);
    expect(() => quickPickSchedule(5, -1, 1500)).toThrow(RangeError);
    expect(() => quickPickSchedule(5, 0, 0)).toThrow(RangeError);
    expect(() => quickPickSchedule(5, 0, -100)).toThrow(RangeError);
  });

  it('returns an array of {index, delay} entries', () => {
    const out = quickPickSchedule(5, 2, 1500);
    expect(Array.isArray(out)).toBe(true);
    for (const step of out) {
      expect(step).toHaveProperty('index');
      expect(step).toHaveProperty('delay');
      expect(Number.isInteger(step.index)).toBe(true);
      expect(step.index).toBeGreaterThanOrEqual(0);
      expect(step.index).toBeLessThan(5);
      expect(step.delay).toBeGreaterThanOrEqual(1);
    }
  });

  it('last step is the winner', () => {
    for (const winner of [0, 1, 2, 3, 4]) {
      const out = quickPickSchedule(5, winner, 1500);
      expect(out[out.length - 1].index).toBe(winner);
    }
  });

  it('penultimate step is NOT the winner (so the snap is visible)', () => {
    // Force a case that would naturally collide: with n=5 and steps=32, the
    // pseudo-deterministic indices include the value 4. Try winner=4.
    const out = quickPickSchedule(5, 4, 1500);
    expect(out[out.length - 2].index).not.toBe(4);
  });

  it('sum of delays matches totalMs', () => {
    const total = 1500;
    const out = quickPickSchedule(5, 0, total);
    const sum = out.reduce((acc, s) => acc + s.delay, 0);
    expect(sum).toBe(total);
  });

  it('delays are monotonically non-decreasing (deceleration)', () => {
    const out = quickPickSchedule(8, 3, 1500);
    for (let k = 1; k < out.length; k++) {
      expect(out[k].delay).toBeGreaterThanOrEqual(out[k - 1].delay);
    }
  });

  it('honours a custom step count', () => {
    const out = quickPickSchedule(4, 1, 800, 16);
    expect(out).toHaveLength(16);
    expect(out[15].index).toBe(1);
  });
});

describe('targetRotationFor', () => {
  it('throws on invalid n / index', () => {
    expect(() => targetRotationFor(0, 1)).toThrow(RangeError);
    expect(() => targetRotationFor(0, 0)).toThrow(RangeError);
    expect(() => targetRotationFor(-1, 5)).toThrow(RangeError);
    expect(() => targetRotationFor(5, 5)).toThrow(RangeError);
    expect(() => targetRotationFor(0.5, 5)).toThrow(RangeError);
  });

  it('embeds the requested number of extra spins', () => {
    const r0 = targetRotationFor(0, 4, 0);
    const r3 = targetRotationFor(0, 4, 3);
    expect(r3 - r0).toBeCloseTo(3 * 360, 9);
  });

  it('produces a non-negative rotation', () => {
    for (let n = 2; n <= 12; n++) {
      for (let i = 0; i < n; i++) {
        const r = targetRotationFor(i, n);
        expect(r).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe('winnerFromRotation / targetRotationFor round trip', () => {
  it('targetRotationFor(i, n) inverts cleanly for n in {2,3,5,7,12,50,100}', () => {
    for (const n of [2, 3, 5, 7, 12, 50, 100]) {
      for (let i = 0; i < n; i++) {
        const r = targetRotationFor(i, n);
        expect(winnerFromRotation(r, n)).toBe(i);
      }
    }
  });

  it('extra spins do not change the resolved winner', () => {
    for (const n of [4, 9]) {
      for (let i = 0; i < n; i++) {
        for (const spins of [0, 1, 5, 10]) {
          const r = targetRotationFor(i, n, spins);
          expect(winnerFromRotation(r, n)).toBe(i);
        }
      }
    }
  });

  it('a rotation in the middle of slice i resolves to i', () => {
    // For n=4, slice 0 covers [0, 90) clockwise from top. Centre is at 45°
    // clockwise from top => pointer relative angle eff such that
    // eff = 360 - 45 = 315° (so the slice's centre is at the pointer).
    expect(winnerFromRotation(315, 4)).toBe(0);
    // A small wobble inside the slice still resolves to 0.
    expect(winnerFromRotation(315 - 10, 4)).toBe(0);
    expect(winnerFromRotation(315 + 10, 4)).toBe(0);
  });

  it('rotation = 0 lands in the first slice (slice 0 contains the pointer at start)', () => {
    // At rotation 0, the pointer (top) sees the boundary between slice n-1
    // and slice 0 (since slice 0 starts at angle 0). Per our epsilon, this
    // should resolve to slice 0.
    expect(winnerFromRotation(0, 4)).toBe(0);
    expect(winnerFromRotation(360, 4)).toBe(0);
  });

  it('rejects non-finite rotations', () => {
    expect(() => winnerFromRotation(NaN, 5)).toThrow(RangeError);
    expect(() => winnerFromRotation(Infinity, 5)).toThrow(RangeError);
  });
});

describe('buildPalette', () => {
  it('returns n distinct HSL strings', () => {
    const p = buildPalette(6);
    expect(p).toHaveLength(6);
    expect(new Set(p).size).toBe(6);
    for (const c of p) expect(c).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
  });

  it('is deterministic — same n produces the same palette', () => {
    expect(buildPalette(8)).toEqual(buildPalette(8));
  });

  it('returns [] for non-positive n', () => {
    expect(buildPalette(0)).toEqual([]);
    expect(buildPalette(-5)).toEqual([]);
    expect(buildPalette(1.5)).toEqual([]);
  });
});

describe('slicePath', () => {
  it('produces a valid SVG path string', () => {
    const d = slicePath(50, 50, 40, 0, 90);
    expect(d).toMatch(/^M 50 50 L /);
    expect(d).toContain('A 40 40 0');
    expect(d.trim().endsWith('Z')).toBe(true);
  });

  it('marks large arcs with the large-arc flag', () => {
    const small = slicePath(50, 50, 40, 0, 90);
    const large = slicePath(50, 50, 40, 0, 270);
    expect(small).toContain(' 0 1 '); // large-arc-flag=0
    expect(large).toContain(' 1 1 '); // large-arc-flag=1
  });
});
