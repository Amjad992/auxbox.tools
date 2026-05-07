import {rgbToHex, relativeLuminance} from '../../lib/color';
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

// S16: render the palette as CSS custom properties.
// Format respects the current display format (hex / rgb / tailwind name).
export function paletteToCSSVars(palette, format) {
  const vars = palette
    .map((c, i) => `  --color-${i + 1}: ${formatColour(c, format)};`)
    .join('\n');
  return `:root {\n${vars}\n}`;
}

// Pick a label colour that contrasts with the swatch background.
// S2: WCAG-correct crossover: (L+0.05)^2 = 1.05*0.05 → L ≈ 0.179.
// The naive 0.5 threshold incorrectly picks white for many mid-tones.
export function readableTextOn(rgb) {
  return relativeLuminance(rgb) > 0.179 ? '#000' : '#fff';
}
