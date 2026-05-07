import {rgbToHex} from '../../lib/color';
import {nearestTailwind} from './tailwind';

export function formatColour(rgb, format) {
  switch (format) {
    case 'hex':
      return rgbToHex(rgb);
    case 'rgb':
      return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    case 'tailwind':
      return nearestTailwind(rgb);
    default:
      return rgbToHex(rgb);
  }
}

export function paletteToText(palette, format) {
  return palette.map((c) => formatColour(c, format)).join('\n');
}

export function relativeLuminance({r, g, b}) {
  const lin = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

// Pick a label colour that contrasts with the swatch background.
export function readableTextOn(rgb) {
  return relativeLuminance(rgb) > 0.5 ? '#000' : '#fff';
}
