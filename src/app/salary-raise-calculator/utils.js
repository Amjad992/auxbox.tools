import {WEEKS_PER_YEAR, MONTHS_PER_YEAR} from './constants';

export function periodFactor(period, hpw) {
  switch (period) {
    case 'hourly':
      return (hpw || 0) * WEEKS_PER_YEAR;
    case 'weekly':
      return WEEKS_PER_YEAR;
    case 'monthly':
      return MONTHS_PER_YEAR;
    case 'annual':
      return 1;
    default:
      return 1;
  }
}

export function toAnnual(value, period, hpw) {
  return value * periodFactor(period, hpw);
}

export function fromAnnual(annual, period, hpw) {
  const factor = periodFactor(period, hpw);
  if (factor === 0) return 0;
  return annual / factor;
}

export function parseNumeric(raw) {
  if (raw === '' || raw === null || raw === undefined) return null;
  const cleaned = String(raw).replace(/,/g, '').trim();
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function formatNumber(n) {
  if (n === null || n === undefined || !Number.isFinite(n)) return '';
  // Strip trailing zeros after rounding to 2 decimals.
  const rounded = Math.round(n * 100) / 100;
  if (rounded === 0) return '0';
  return rounded.toFixed(2).replace(/\.?0+$/, '');
}

export function deriveRaiseAnnual(state) {
  const {beforeAnnual, raiseMode, raiseValue} = state;
  if (raiseMode === 'percent') return (beforeAnnual * raiseValue) / 100;
  if (raiseMode === 'amount') return raiseValue;
  return 0;
}

export function deriveRaisePercent(state) {
  const {beforeAnnual, raiseMode, raiseValue} = state;
  if (raiseMode === 'percent') return raiseValue;
  if (raiseMode === 'amount') {
    if (!beforeAnnual) return null;
    return (raiseValue / beforeAnnual) * 100;
  }
  return null;
}
