import {BACKGROUND_VALUES} from './constants';

const ALLOWED_KEYS = new Set(['includeIco', 'background']);

export function validateFaviconGeneratorState(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  if (typeof data.includeIco !== 'boolean') return false;
  if (typeof data.background !== 'string' || !BACKGROUND_VALUES.includes(data.background))
    return false;
  for (const key of Object.keys(data)) {
    if (!ALLOWED_KEYS.has(key)) return false;
  }
  return true;
}
