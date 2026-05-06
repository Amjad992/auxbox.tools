// Tip Calculator persisted state validator + storage re-export.

export {
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
} from '../../lib/storage';

import {CURRENCY_VALUES} from '../../lib/currencies';
import {BOUNDS} from './constants';

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
  if (typeof bill === 'number' && bill < 0) return false;
  if (!isNum(tipPct) || tipPct < BOUNDS.TIP_PCT_MIN || tipPct > BOUNDS.TIP_PCT_MAX)
    return false;
  if (
    !isNum(people) ||
    !Number.isInteger(people) ||
    people < BOUNDS.PEOPLE_MIN ||
    people > BOUNDS.PEOPLE_MAX
  )
    return false;
  return true;
}
