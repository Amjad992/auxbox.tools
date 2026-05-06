// Freelance Rate Calculator — pure math.
// All inputs are plain numbers; percentages are 0..100 (whole percent).

import {COST_PERIOD} from './constants';

/** Total *available* hours per year. */
export function workingHoursPerYear({
  hoursPerDay,
  daysPerWeek,
  weeksPerYear,
}) {
  const h = num(hoursPerDay);
  const d = num(daysPerWeek);
  const w = num(weeksPerYear);
  return Math.max(0, h * d * w);
}

/** Billable hours per year — `working × utilization`. */
export function billableHoursPerYear({
  hoursPerDay,
  daysPerWeek,
  weeksPerYear,
  utilization,
}) {
  const working = workingHoursPerYear({
    hoursPerDay,
    daysPerWeek,
    weeksPerYear,
  });
  return working * (num(utilization) / 100);
}

/** Sum a mixed list of `{amount, period}` line items into an annual total. */
export function totalAnnualCosts(lineItems = []) {
  if (!Array.isArray(lineItems)) return 0;
  let total = 0;
  for (const item of lineItems) {
    if (!item) continue;
    const amt = num(item.amount);
    if (!Number.isFinite(amt) || amt <= 0) continue;
    total += item.period === COST_PERIOD.ANNUAL ? amt : amt * 12;
  }
  return total;
}

/**
 * Apply the compound fee chain.
 *
 *   net = gross × (1 − platformFee) × (1 − processorFee) × (1 − otherFee) × (1 − incomeTax)
 *
 * The order matters: platform first (skimmed by the platform off the top),
 * then processor (skimmed by the gateway off what reaches the bank), then
 * "other" (catch-all third-party), then income tax (paid on the remainder).
 *
 * Returns `{net, breakdown}` where breakdown contains the actual dollar
 * amount taken by each fee at the cumulative reduction step. The four
 * breakdown values plus `net` sum back to `gross` (within float epsilon).
 */
export function applyFees(gross, fees = {}) {
  const g = num(gross);
  const platform = clampPct(fees.platformFee);
  const processor = clampPct(fees.processorFee);
  const other = clampPct(fees.otherFee);
  const tax = clampPct(fees.incomeTax);

  const afterPlatform = g * (1 - platform);
  const afterProcessor = afterPlatform * (1 - processor);
  const afterOther = afterProcessor * (1 - other);
  const net = afterOther * (1 - tax);

  return {
    net,
    breakdown: {
      platform: g - afterPlatform,
      processor: afterPlatform - afterProcessor,
      other: afterProcessor - afterOther,
      income: afterOther - net,
      total: g - net,
    },
  };
}

/** Quote mode — `hours × rate` then deductions. */
export function quote({hours, rate, fees}) {
  const gross = num(hours) * num(rate);
  const {net, breakdown} = applyFees(gross, fees);
  const effectiveHourly = num(hours) > 0 ? net / num(hours) : 0;
  return {gross, net, breakdown, effectiveHourly};
}

/**
 * Income mode — given hourly rate + working time + costs + fees + people,
 * project gross & net at every time horizon.
 *
 * Math:
 *   billable_year = billableHoursPerYear(time) × people
 *   gross_year    = rate × billable_year
 *   gross_minus_costs = gross_year − costs
 *   net_year      = applyFees(gross_minus_costs, fees).net
 *
 * Hourly figures are scaled per *billable* hour to stay consistent with
 * the rate the freelancer charges.
 */
export function incomeForRate({rate, billableHours, costs, fees, people = 1}) {
  const r = num(rate);
  const bhPerPerson = num(billableHours);
  const totalBillable = bhPerPerson * num(people);
  const grossYear = r * totalBillable;
  const grossMinusCosts = Math.max(0, grossYear - num(costs));
  const {net: netYear, breakdown} = applyFees(grossMinusCosts, fees);
  const grossHour = totalBillable > 0 ? grossYear / totalBillable : r;
  const netHour = totalBillable > 0 ? netYear / totalBillable : 0;
  return {
    annual: {gross: grossYear, net: netYear},
    monthly: {gross: grossYear / 12, net: netYear / 12},
    weekly: {gross: grossYear / 52, net: netYear / 52},
    daily: {gross: grossYear / 260, net: netYear / 260},
    hourly: {gross: grossHour, net: netHour},
    totalBillableHours: totalBillable,
    costsAnnual: num(costs),
    breakdown,
  };
}

/**
 * Rate mode — closed-form algebra.
 *
 * We want net annual take-home == targetIncome × (1 + profitMargin).
 *
 *   feeFactor = (1 − platform) × (1 − processor) × (1 − other) × (1 − tax)
 *   net = (rate × billable_total − costs) × feeFactor
 *
 * Solving for rate:
 *
 *   rate = (target × (1 + margin) / feeFactor + costs) / billable_total
 *
 * If `feeFactor` is zero (someone set every fee to 100%) the answer is
 * undefined; we return Infinity in that case so the UI can show "—".
 */
export function requiredRateForTakeHome({
  targetIncome,
  billableHours,
  costs,
  fees,
  profitMargin = 0,
  people = 1,
}) {
  const target = num(targetIncome);
  const totalBillable = num(billableHours) * num(people);
  const margin = num(profitMargin) / 100;
  const platform = clampPct(fees?.platformFee);
  const processor = clampPct(fees?.processorFee);
  const other = clampPct(fees?.otherFee);
  const tax = clampPct(fees?.incomeTax);
  const feeFactor =
    (1 - platform) * (1 - processor) * (1 - other) * (1 - tax);

  if (totalBillable <= 0) return {rate: Infinity, breakdown: null};
  if (feeFactor <= 0) return {rate: Infinity, breakdown: null};

  const grossNeeded = target * (1 + margin);
  const requiredGrossPretax = grossNeeded / feeFactor + num(costs);
  const rate = requiredGrossPretax / totalBillable;

  return {
    rate,
    breakdown: {
      target,
      profit: target * margin,
      costs: num(costs),
      // Per-hour cost coverage at the resulting rate (informative).
      costsPerHour: num(costs) / totalBillable,
      feesPerHour: (rate * totalBillable - costs - grossNeeded) / totalBillable,
      // The dollars the fee chain consumes at the resulting gross.
      feeConsumed:
        rate * totalBillable - num(costs) - grossNeeded,
      grossNeededAfterCosts: grossNeeded,
      totalBillableHours: totalBillable,
      feeFactor,
    },
  };
}

// ─── helpers ──────────────────────────────────────────────────

function num(x) {
  if (typeof x === 'number') return Number.isFinite(x) ? x : 0;
  if (typeof x === 'string' && x.trim() !== '') {
    const v = parseFloat(x);
    return Number.isFinite(v) ? v : 0;
  }
  return 0;
}

function clampPct(p) {
  const v = num(p);
  if (v <= 0) return 0;
  if (v >= 100) return 1;
  return v / 100;
}

// Re-export for tests.
export const _internal = {num, clampPct};

/**
 * Parse a flexible duration string into decimal hours.
 *
 * Accepts:
 *   - decimal hours:        "12", "12.5", "0.25", "12,5"
 *   - colon notation:       "12:19", "0:30", "1:05"
 *   - h/m suffixes:         "12h 19m", "12h19m", "12 h 19 m", "30m", "2h"
 *   - whitespace tolerant:  "  12 : 19  "
 *
 * Returns null when the input is empty or unparseable. Negative inputs
 * also return null (no negative durations).
 *
 * Examples:
 *   parseHours("12.5")      → 12.5
 *   parseHours("12:19")     → 12.31666… (12 + 19/60)
 *   parseHours("12h 19m")   → 12.31666…
 *   parseHours("30m")       → 0.5
 *   parseHours("")          → null
 */
export function parseHours(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (s === '') return null;

  // 1. h/m form: "12h 19m" or "30m" or "2h"
  const hmMatch = s
    .toLowerCase()
    .match(/^(?:(\d+(?:[.,]\d+)?)\s*h)?\s*(?:(\d+(?:[.,]\d+)?)\s*m)?$/);
  if (hmMatch && (hmMatch[1] || hmMatch[2])) {
    const h = hmMatch[1] ? parseFloat(hmMatch[1].replace(',', '.')) : 0;
    const m = hmMatch[2] ? parseFloat(hmMatch[2].replace(',', '.')) : 0;
    if (Number.isFinite(h) && Number.isFinite(m) && h >= 0 && m >= 0) {
      return h + m / 60;
    }
  }

  // 2. Colon form: "12:19"
  const colonMatch = s.match(/^(\d+)\s*:\s*(\d+(?:\.\d+)?)$/);
  if (colonMatch) {
    const h = parseInt(colonMatch[1], 10);
    const m = parseFloat(colonMatch[2]);
    if (Number.isFinite(h) && Number.isFinite(m) && h >= 0 && m >= 0 && m < 60) {
      return h + m / 60;
    }
  }

  // 3. Decimal — accept comma OR dot as separator. Reject any string
  // with trailing/extra characters (parseFloat is too lenient).
  const normalized = s.replace(',', '.');
  if (/^\d+(\.\d+)?$/.test(normalized)) {
    const decimal = parseFloat(normalized);
    if (Number.isFinite(decimal) && decimal >= 0) return decimal;
  }

  return null;
}

/**
 * Format decimal hours back to a "Xh Ym" label for display next to the
 * Hours input. Used as live feedback when the user types in any accepted
 * format. Pure helper so it can be unit tested.
 */
export function formatHoursLabel(decimalHours) {
  if (!Number.isFinite(decimalHours) || decimalHours < 0) return '';
  if (decimalHours === 0) return '0h';
  const totalMinutes = Math.round(decimalHours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
