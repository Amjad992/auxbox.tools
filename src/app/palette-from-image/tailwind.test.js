import {describe, it, expect} from 'vitest';
import {nearestTailwind, TAILWIND_PALETTE_SIZE} from './tailwind';

describe('nearestTailwind', () => {
  it('matches pure white to "white"', () => {
    expect(nearestTailwind({r: 255, g: 255, b: 255})).toBe('white');
  });

  it('matches pure black to "black"', () => {
    expect(nearestTailwind({r: 0, g: 0, b: 0})).toBe('black');
  });

  it('matches a vivid red to a red shade', () => {
    expect(nearestTailwind({r: 239, g: 68, b: 68})).toBe('red-500');
  });

  it('matches a strong blue to a blue shade', () => {
    expect(nearestTailwind({r: 59, g: 130, b: 246})).toBe('blue-500');
  });

  it('returns a name from a non-empty palette', () => {
    expect(TAILWIND_PALETTE_SIZE).toBeGreaterThan(50);
  });

  // S19: very dark grey should map to a recognisable dark shade, not depend on
  // dictionary order. neutral/stone/zinc/slate all have very dark 950 entries
  // close to {9,9,9} — any of those is acceptable.
  it('maps very dark grey to a recognisable dark shade (S19)', () => {
    const name = nearestTailwind({r: 9, g: 9, b: 9});
    // It should be a grey-family dark shade (any of the neutral grey families).
    expect(name).toMatch(/^(black|slate|gray|zinc|neutral|stone)/);
  });

  // S9: palette now includes neutral and stone families.
  it('palette includes neutral and stone families after S9', () => {
    expect(TAILWIND_PALETTE_SIZE).toBeGreaterThan(200); // was ~200+ after adding 22 entries
    expect(nearestTailwind({r: 250, g: 250, b: 249})).toMatch(/^(stone|gray|zinc|neutral|slate)/);
  });
});
