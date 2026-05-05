// Freelance Rate Calculator persisted state validator + storage re-export.

export {
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
} from '../../lib/storage';

import {
  COSTS_VIEW_VALUES,
  COST_PERIOD_VALUES,
  CURRENCY_VALUES,
  MODE_VALUES,
} from './constants';

function isNumOrNull(v) {
  return v === null || (typeof v === 'number' && Number.isFinite(v));
}

function isNum(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

export function validateFreelanceRateState(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const {
    mode,
    currency,
    time,
    rate,
    hours,
    targetIncome,
    team,
    costs,
    fees,
    profitMargin,
  } = data;

  if (typeof mode !== 'string' || !MODE_VALUES.includes(mode)) return false;
  if (typeof currency !== 'string' || !CURRENCY_VALUES.includes(currency))
    return false;
  if (!time || typeof time !== 'object') return false;
  if (
    !isNum(time.hoursPerDay) ||
    !isNum(time.daysPerWeek) ||
    !isNum(time.weeksPerYear) ||
    !isNum(time.utilization)
  )
    return false;
  if (!isNumOrNull(rate)) return false;
  if (!isNumOrNull(hours)) return false;
  if (!isNumOrNull(targetIncome)) return false;
  if (!team || typeof team !== 'object' || !isNum(team.people)) return false;
  if (!costs || typeof costs !== 'object') return false;
  if (typeof costs.view !== 'string' || !COSTS_VIEW_VALUES.includes(costs.view))
    return false;
  if (!isNumOrNull(costs.quickAmount)) return false;
  if (
    typeof costs.quickPeriod !== 'string' ||
    !COST_PERIOD_VALUES.includes(costs.quickPeriod)
  )
    return false;
  if (!Array.isArray(costs.lineItems)) return false;
  for (const it of costs.lineItems) {
    if (!it || typeof it !== 'object') return false;
    if (typeof it.id !== 'string' || typeof it.label !== 'string') return false;
    if (!isNumOrNull(it.amount)) return false;
    if (
      typeof it.period !== 'string' ||
      !COST_PERIOD_VALUES.includes(it.period)
    )
      return false;
  }
  if (!fees || typeof fees !== 'object') return false;
  for (const f of ['platformFee', 'processorFee', 'incomeTax', 'otherFee']) {
    if (!isNum(fees[f])) return false;
  }
  if (!isNum(profitMargin)) return false;
  return true;
}
