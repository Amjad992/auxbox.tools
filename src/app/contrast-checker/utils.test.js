// Smoke test: verify the re-export shim surfaces all public symbols.
// Full unit tests live in src/lib/color.test.js.
import {describe, it, expect} from 'vitest';
import {
  compositeOver,
  contrastRatio,
  parseColor,
  relativeLuminance,
  rgbToCss,
  rgbToHex,
} from './utils';

describe('utils re-exports from src/lib/color', () => {
  it('parseColor is callable', () => {
    expect(parseColor('#fff')).toEqual({r: 255, g: 255, b: 255, a: 1});
  });

  it('contrastRatio is callable', () => {
    expect(
      contrastRatio({r: 0, g: 0, b: 0, a: 1}, {r: 255, g: 255, b: 255, a: 1})
    ).toBeCloseTo(21, 1);
  });

  it('relativeLuminance is callable', () => {
    expect(relativeLuminance({r: 255, g: 255, b: 255})).toBeCloseTo(1, 5);
  });

  it('rgbToHex is callable', () => {
    expect(rgbToHex({r: 255, g: 0, b: 0})).toBe('#ff0000');
  });

  it('rgbToCss is callable', () => {
    expect(rgbToCss({r: 0, g: 0, b: 0, a: 1})).toBe('rgb(0, 0, 0)');
  });

  it('compositeOver is callable', () => {
    const fg = {r: 0, g: 0, b: 0, a: 1};
    const bg = {r: 255, g: 255, b: 255, a: 1};
    expect(compositeOver(fg, bg)).toEqual({r: 0, g: 0, b: 0, a: 1});
  });
});
