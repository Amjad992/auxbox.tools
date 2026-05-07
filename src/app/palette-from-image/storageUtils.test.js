import {describe, it, expect} from 'vitest';
import {validatePaletteState} from './storageUtils';

describe('validatePaletteState', () => {
  it('accepts the default shape', () => {
    expect(validatePaletteState({colourCount: 6, format: 'hex'})).toBe(true);
  });

  it('rejects out-of-range count', () => {
    expect(validatePaletteState({colourCount: 1, format: 'hex'})).toBe(false);
    expect(validatePaletteState({colourCount: 32, format: 'hex'})).toBe(false);
  });

  it('rejects unknown format', () => {
    expect(validatePaletteState({colourCount: 6, format: 'lch'})).toBe(false);
  });

  it('rejects unknown keys', () => {
    expect(validatePaletteState({colourCount: 6, format: 'hex', extra: 1})).toBe(false);
  });

  it('rejects null / non-object', () => {
    expect(validatePaletteState(null)).toBe(false);
    expect(validatePaletteState([])).toBe(false);
  });
});
