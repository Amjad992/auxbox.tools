import {describe, it, expect} from 'vitest';
import {
  compositeOver,
  contrastRatio,
  parseColor,
  relativeLuminance,
  rgbToCss,
  rgbToHex,
} from './utils';

describe('parseColor', () => {
  it('parses 6-digit hex', () => {
    expect(parseColor('#ffffff')).toEqual({r: 255, g: 255, b: 255, a: 1});
    expect(parseColor('#000000')).toEqual({r: 0, g: 0, b: 0, a: 1});
    expect(parseColor('#1a2b3c')).toEqual({r: 26, g: 43, b: 60, a: 1});
  });

  it('parses 3-digit hex (expanded)', () => {
    expect(parseColor('#fff')).toEqual({r: 255, g: 255, b: 255, a: 1});
    expect(parseColor('#abc')).toEqual({r: 170, g: 187, b: 204, a: 1});
  });

  it('parses 8-digit hex with alpha', () => {
    const c = parseColor('#11223380');
    expect(c.r).toBe(17);
    expect(c.g).toBe(34);
    expect(c.b).toBe(51);
    expect(c.a).toBeCloseTo(128 / 255, 5);
  });

  it('parses rgb(...)', () => {
    expect(parseColor('rgb(255, 0, 128)')).toEqual({
      r: 255,
      g: 0,
      b: 128,
      a: 1,
    });
  });

  it('parses rgba(...) with alpha', () => {
    const c = parseColor('rgba(255, 0, 0, 0.5)');
    expect(c).toEqual({r: 255, g: 0, b: 0, a: 0.5});
  });

  it('parses hsl(...) — pure red', () => {
    const c = parseColor('hsl(0, 100%, 50%)');
    expect(c.r).toBe(255);
    expect(c.g).toBe(0);
    expect(c.b).toBe(0);
  });

  it('parses hsla(...)', () => {
    const c = parseColor('hsla(120, 100%, 50%, 0.4)');
    expect(c.r).toBe(0);
    expect(c.g).toBe(255);
    expect(c.b).toBe(0);
    expect(c.a).toBeCloseTo(0.4, 5);
  });

  it('rejects garbage', () => {
    expect(parseColor('')).toBeNull();
    expect(parseColor('#zzz')).toBeNull();
    expect(parseColor('rgb()')).toBeNull();
    expect(parseColor('hsl(120, 50, 50)')).toBeNull(); // missing %
    expect(parseColor('not a color')).toBeNull();
  });
});

describe('contrastRatio', () => {
  const black = {r: 0, g: 0, b: 0, a: 1};
  const white = {r: 255, g: 255, b: 255, a: 1};

  it('black-on-white = 21', () => {
    expect(contrastRatio(black, white)).toBeCloseTo(21, 1);
  });

  it('same-color = 1', () => {
    expect(contrastRatio(black, black)).toBeCloseTo(1, 5);
    expect(contrastRatio(white, white)).toBeCloseTo(1, 5);
  });

  it('is symmetric', () => {
    const r = parseColor('#ff6b6b');
    const w = parseColor('#ffffff');
    expect(contrastRatio(r, w)).toBeCloseTo(contrastRatio(w, r), 5);
  });

  it('returns 0 for null inputs', () => {
    expect(contrastRatio(null, white)).toBe(0);
    expect(contrastRatio(white, null)).toBe(0);
  });
});

describe('relativeLuminance', () => {
  it('white = 1', () => {
    expect(relativeLuminance({r: 255, g: 255, b: 255})).toBeCloseTo(1, 5);
  });

  it('black = 0', () => {
    expect(relativeLuminance({r: 0, g: 0, b: 0})).toBe(0);
  });

  it('green is brighter than red', () => {
    expect(
      relativeLuminance({r: 0, g: 255, b: 0})
    ).toBeGreaterThan(relativeLuminance({r: 255, g: 0, b: 0}));
  });
});

describe('rgbToHex / rgbToCss', () => {
  it('rgbToHex pads single digits', () => {
    expect(rgbToHex({r: 1, g: 2, b: 3})).toBe('#010203');
  });

  it('rgbToHex clamps out-of-range', () => {
    expect(rgbToHex({r: 300, g: -10, b: 128})).toBe('#ff0080');
  });

  it('rgbToCss returns rgb when alpha is 1', () => {
    expect(rgbToCss({r: 1, g: 2, b: 3, a: 1})).toBe('rgb(1, 2, 3)');
  });

  it('rgbToCss returns rgba when alpha < 1', () => {
    expect(rgbToCss({r: 1, g: 2, b: 3, a: 0.5})).toBe(
      'rgba(1, 2, 3, 0.5)'
    );
  });
});

describe('compositeOver', () => {
  const white = {r: 255, g: 255, b: 255, a: 1};

  it('opaque foreground passes through', () => {
    const fg = {r: 100, g: 100, b: 100, a: 1};
    expect(compositeOver(fg, white)).toEqual({
      r: 100,
      g: 100,
      b: 100,
      a: 1,
    });
  });

  it('50% black on white = 128 gray', () => {
    const fg = {r: 0, g: 0, b: 0, a: 0.5};
    const r = compositeOver(fg, white);
    expect(r.r).toBeGreaterThanOrEqual(127);
    expect(r.r).toBeLessThanOrEqual(128);
  });

  it('returns null for null inputs', () => {
    expect(compositeOver(null, white)).toBeNull();
    expect(compositeOver(white, null)).toBeNull();
  });
});
