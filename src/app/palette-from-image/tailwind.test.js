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
});
