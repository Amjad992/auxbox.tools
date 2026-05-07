import {FORMAT_VALUES, MAX_COLOURS, MIN_COLOURS} from './constants';

const ALLOWED_KEYS = new Set(['colourCount', 'format']);

export function validatePaletteState(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  if (
    typeof data.colourCount !== 'number' ||
    !Number.isInteger(data.colourCount) ||
    data.colourCount < MIN_COLOURS ||
    data.colourCount > MAX_COLOURS
  )
    return false;
  if (typeof data.format !== 'string' || !FORMAT_VALUES.includes(data.format)) return false;
  for (const key of Object.keys(data)) {
    if (!ALLOWED_KEYS.has(key)) return false;
  }
  return true;
}
