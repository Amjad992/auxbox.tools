// Exchange Rates persisted-state validator.

import {
  MAX_TARGETS,
  CURRENCY_CODE_RE,
  DATE_RE,
} from './constants';

const ALLOWED_KEYS = new Set(['base', 'targets', 'amount', 'lastDate']);

export function validateExchangeRatesState(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;

  // base: required, valid code
  if (typeof data.base !== 'string' || !CURRENCY_CODE_RE.test(data.base)) return false;

  // targets: required array of valid codes
  if (!Array.isArray(data.targets)) return false;
  if (data.targets.length > MAX_TARGETS) return false;
  for (const c of data.targets) {
    if (typeof c !== 'string' || !CURRENCY_CODE_RE.test(c)) return false;
  }

  // amount: required finite non-negative number
  if (typeof data.amount !== 'number' || !isFinite(data.amount) || data.amount < 0) return false;

  // lastDate: optional YYYY-MM-DD string
  if ('lastDate' in data) {
    if (typeof data.lastDate !== 'string' || !DATE_RE.test(data.lastDate)) return false;
  }

  // No extra keys
  for (const key of Object.keys(data)) {
    if (!ALLOWED_KEYS.has(key)) return false;
  }

  return true;
}
