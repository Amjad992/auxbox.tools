import {describe, it, expect} from 'vitest';
import {validateFaviconGeneratorState} from './storageUtils';

describe('validateFaviconGeneratorState', () => {
  it('accepts the default shape', () => {
    expect(
      validateFaviconGeneratorState({includeIco: true, background: 'transparent'})
    ).toBe(true);
  });

  it('rejects unknown keys', () => {
    expect(
      validateFaviconGeneratorState({
        includeIco: true,
        background: 'transparent',
        extra: 1,
      })
    ).toBe(false);
  });

  it('rejects bad types and unknown enum values', () => {
    expect(validateFaviconGeneratorState(null)).toBe(false);
    expect(validateFaviconGeneratorState({includeIco: 'yes', background: 'white'})).toBe(false);
    expect(
      validateFaviconGeneratorState({includeIco: true, background: 'fuchsia'})
    ).toBe(false);
  });
});
