// Bill Splitter persisted state validator + storage re-export.

export {
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
} from '../../lib/storage';

import {CURRENCY_VALUES} from '../../lib/currencies';
import {BOUNDS, SHARED_ASSIGNMENT} from './constants';

function isNum(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

function isNumOrNull(v) {
  return v === null || isNum(v);
}

export function validateBillSplitterState(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const {currency, people, items, taxPct, tipPct} = data;

  if (typeof currency !== 'string' || !CURRENCY_VALUES.includes(currency))
    return false;

  if (!Array.isArray(people) || people.length < 1) return false;
  const peopleIds = new Set();
  for (const p of people) {
    if (!p || typeof p !== 'object') return false;
    if (typeof p.id !== 'string' || typeof p.name !== 'string') return false;
    peopleIds.add(p.id);
  }

  if (!Array.isArray(items)) return false;
  for (const it of items) {
    if (!it || typeof it !== 'object') return false;
    if (typeof it.id !== 'string') return false;
    if (typeof it.label !== 'string') return false;
    if (!isNumOrNull(it.amount)) return false;
    if (typeof it.assignedTo !== 'string') return false;
    // Referential integrity: assignedTo must be 'shared' or a known
    // person id. Stale assignments after a person is removed get
    // rejected here so a fresh hydrate doesn't silently re-bucket the
    // diner's items into 'shared'.
    if (it.assignedTo !== SHARED_ASSIGNMENT && !peopleIds.has(it.assignedTo)) {
      return false;
    }
  }

  if (
    !isNum(taxPct) ||
    taxPct < BOUNDS.TAX_PCT_MIN ||
    taxPct > BOUNDS.TAX_PCT_MAX
  )
    return false;
  if (
    !isNum(tipPct) ||
    tipPct < BOUNDS.TIP_PCT_MIN ||
    tipPct > BOUNDS.TIP_PCT_MAX
  )
    return false;

  return true;
}
