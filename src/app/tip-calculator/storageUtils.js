// Tip Calculator persisted state validator + storage re-export.

export {
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
} from '../../lib/storage';

import {CURRENCY_VALUES} from '../../lib/currencies';

function isNumOrNull(v) {
  return v === null || (typeof v === 'number' && Number.isFinite(v));
}

function isNum(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

export function validateTipCalculatorState(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const {currency, bill, tipPct, people} = data;
  if (typeof currency !== 'string' || !CURRENCY_VALUES.includes(currency))
    return false;
  if (!isNumOrNull(bill)) return false;
  if (!isNum(tipPct)) return false;
  if (!isNum(people)) return false;
  return true;
}
