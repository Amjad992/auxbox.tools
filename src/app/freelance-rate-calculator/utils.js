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
