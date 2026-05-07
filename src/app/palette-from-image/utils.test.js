import {describe, it, expect} from 'vitest';
import {formatColour, paletteToText, readableTextOn} from './utils';

describe('formatColour', () => {
  it('formats as hex', () => {
    expect(formatColour({r: 255, g: 0, b: 0}, 'hex')).toBe('#ff0000');
  });

  it('formats as rgb()', () => {
    expect(formatColour({r: 10, g: 20, b: 30}, 'rgb')).toBe('rgb(10, 20, 30)');
  });

  it('formats as nearest tailwind', () => {
    expect(formatColour({r: 0, g: 0, b: 0}, 'tailwind')).toBe('black');
  });
});

describe('paletteToText', () => {
  it('joins formatted entries with newlines', () => {
    expect(
      paletteToText([{r: 0, g: 0, b: 0}, {r: 255, g: 255, b: 255}], 'hex')
    ).toBe('#000000\n#ffffff');
  });
});

describe('readableTextOn', () => {
  it('returns white on dark, black on light', () => {
    expect(readableTextOn({r: 0, g: 0, b: 0})).toBe('#fff');
    expect(readableTextOn({r: 255, g: 255, b: 255})).toBe('#000');
  });
});
