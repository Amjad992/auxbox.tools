import {describe, it, expect} from 'vitest';
import {
  workingHoursPerYear,
  billableHoursPerYear,
  totalAnnualCosts,
  applyFees,
  quote,
  incomeForRate,
  requiredRateForTakeHome,
} from './utils';
import {COST_PERIOD} from './constants';

describe('workingHoursPerYear', () => {
  it('multiplies hours × days × weeks', () => {
    expect(
      workingHoursPerYear({hoursPerDay: 8, daysPerWeek: 5, weeksPerYear: 48})
    ).toBe(1920);
    expect(
      workingHoursPerYear({hoursPerDay: 6, daysPerWeek: 4, weeksPerYear: 50})
    ).toBe(1200);
  });

  it('returns 0 for zero weeks', () => {
    expect(
      workingHoursPerYear({hoursPerDay: 8, daysPerWeek: 5, weeksPerYear: 0})
    ).toBe(0);
  });

  it('clamps negative inputs to zero', () => {
    expect(
      workingHoursPerYear({
        hoursPerDay: -8,
        daysPerWeek: 5,
        weeksPerYear: 48,
      })
    ).toBe(0);
  });
});

describe('billableHoursPerYear', () => {
  it('working × utilization', () => {
    expect(
      billableHoursPerYear({
        hoursPerDay: 8,
        daysPerWeek: 5,
        weeksPerYear: 48,
        utilization: 70,
      })
    ).toBe(1344);
  });

  it('100% utilization → working === billable', () => {
    expect(
      billableHoursPerYear({
        hoursPerDay: 8,
        daysPerWeek: 5,
        weeksPerYear: 48,
        utilization: 100,
      })
    ).toBe(1920);
  });

  it('0% utilization → 0 hours', () => {
    expect(
      billableHoursPerYear({
        hoursPerDay: 8,
        daysPerWeek: 5,
        weeksPerYear: 48,
        utilization: 0,
      })
    ).toBe(0);
  });
});

describe('totalAnnualCosts', () => {
  it('returns 0 for an empty list', () => {
    expect(totalAnnualCosts([])).toBe(0);
    expect(totalAnnualCosts(undefined)).toBe(0);
    expect(totalAnnualCosts(null)).toBe(0);
  });

  it('sums monthly entries × 12 + annual entries', () => {
    expect(
      totalAnnualCosts([
        {amount: 100, period: COST_PERIOD.MONTHLY},
        {amount: 1200, period: COST_PERIOD.ANNUAL},
        {amount: 50, period: COST_PERIOD.MONTHLY},
      ])
    ).toBe(100 * 12 + 1200 + 50 * 12);
  });

  it('skips invalid amounts', () => {
    expect(
      totalAnnualCosts([
        {amount: 0, period: COST_PERIOD.MONTHLY},
        {amount: -5, period: COST_PERIOD.ANNUAL},
        {amount: 'x', period: COST_PERIOD.MONTHLY},
        {amount: 100, period: COST_PERIOD.MONTHLY},
      ])
    ).toBe(1200);
  });
});

describe('applyFees (compound chain)', () => {
  it('passthrough when all fees are 0', () => {
    const r = applyFees(1000, {});
    expect(r.net).toBe(1000);
    expect(r.breakdown.total).toBe(0);
  });

  it('100% on any fee → zero net', () => {
    expect(applyFees(1000, {platformFee: 100}).net).toBe(0);
    expect(applyFees(1000, {incomeTax: 100}).net).toBe(0);
  });

  it('compound — not additive', () => {
    // 10% platform + 25% tax compound = 1000 × 0.9 × 0.75 = 675, NOT 650.
    const r = applyFees(1000, {platformFee: 10, incomeTax: 25});
    expect(r.net).toBeCloseTo(675, 5);
  });

  it('breakdown amounts sum back to gross', () => {
    const gross = 1000;
    const r = applyFees(gross, {
      platformFee: 10,
      processorFee: 3,
      otherFee: 2,
      incomeTax: 20,
    });
    const sum =
      r.breakdown.platform +
      r.breakdown.processor +
      r.breakdown.other +
      r.breakdown.income +
      r.net;
    expect(sum).toBeCloseTo(gross, 5);
    expect(r.breakdown.total).toBeCloseTo(gross - r.net, 5);
  });

  it('order of platform/processor/other/tax matches spec', () => {
    // Platform first (off the top); the dollar amount it skims should equal
    // gross × platform% irrespective of the other fees.
    const r = applyFees(1000, {
      platformFee: 10,
      processorFee: 50,
      otherFee: 50,
      incomeTax: 50,
    });
    expect(r.breakdown.platform).toBeCloseTo(100, 5);
  });
});

describe('quote', () => {
  it('hours × rate when no fees', () => {
    const r = quote({hours: 10, rate: 100, fees: {}});
    expect(r.gross).toBe(1000);
    expect(r.net).toBe(1000);
    expect(r.effectiveHourly).toBe(100);
  });

  it('matches applyFees on the gross', () => {
    const fees = {platformFee: 10, incomeTax: 25};
    const r = quote({hours: 10, rate: 100, fees});
    const direct = applyFees(1000, fees);
    expect(r.net).toBeCloseTo(direct.net, 5);
    expect(r.effectiveHourly).toBeCloseTo(direct.net / 10, 5);
  });

  it('zero hours → zero quote, zero effective hourly', () => {
    const r = quote({hours: 0, rate: 100, fees: {}});
    expect(r.gross).toBe(0);
    expect(r.effectiveHourly).toBe(0);
  });
});

describe('incomeForRate', () => {
  const time = {
    hoursPerDay: 8,
    daysPerWeek: 5,
    weeksPerYear: 48,
    utilization: 70,
  };
  const billable = billableHoursPerYear(time);

  it('annual = rate × billable hours when no costs/fees/team', () => {
    const r = incomeForRate({
      rate: 100,
      billableHours: billable,
      costs: 0,
      fees: {},
      people: 1,
    });
    expect(r.annual.gross).toBe(100 * billable);
    expect(r.annual.net).toBe(100 * billable);
  });

  it('linear in team size (people doubles → revenue doubles)', () => {
    const a = incomeForRate({
      rate: 100,
      billableHours: billable,
      costs: 0,
      fees: {},
      people: 1,
    });
    const b = incomeForRate({
      rate: 100,
      billableHours: billable,
      costs: 0,
      fees: {},
      people: 2,
    });
    expect(b.annual.gross).toBeCloseTo(2 * a.annual.gross, 5);
  });

  it('costs reduce annual net', () => {
    const r = incomeForRate({
      rate: 100,
      billableHours: billable,
      costs: 10000,
      fees: {},
      people: 1,
    });
    expect(r.annual.net).toBe(100 * billable - 10000);
  });

  it('per-hour figures use *billable* hours', () => {
    const r = incomeForRate({
      rate: 100,
      billableHours: billable,
      costs: 0,
      fees: {},
      people: 1,
    });
    expect(r.hourly.gross).toBeCloseTo(100, 5);
  });
});

describe('requiredRateForTakeHome (round-trip)', () => {
  const time = {
    hoursPerDay: 8,
    daysPerWeek: 5,
    weeksPerYear: 48,
    utilization: 70,
  };
  const billable = billableHoursPerYear(time);

  it('with no fees/costs/profit: rate × billable === target', () => {
    const r = requiredRateForTakeHome({
      targetIncome: 100000,
      billableHours: billable,
      costs: 0,
      fees: {},
      profitMargin: 0,
      people: 1,
    });
    expect(r.rate * billable).toBeCloseTo(100000, 5);
  });

  it('round-trip: feeding the answer into incomeForRate reproduces target', () => {
    const fees = {platformFee: 10, processorFee: 3, incomeTax: 20};
    const target = 80000;
    const costs = 12000;
    const r = requiredRateForTakeHome({
      targetIncome: target,
      billableHours: billable,
      costs,
      fees,
      profitMargin: 0,
      people: 1,
    });
    const back = incomeForRate({
      rate: r.rate,
      billableHours: billable,
      costs,
      fees,
      people: 1,
    });
    expect(back.annual.net).toBeCloseTo(target, 3);
  });

  it('profit margin scales the required net upward', () => {
    const target = 60000;
    const a = requiredRateForTakeHome({
      targetIncome: target,
      billableHours: billable,
      costs: 0,
      fees: {},
      profitMargin: 0,
      people: 1,
    });
    const b = requiredRateForTakeHome({
      targetIncome: target,
      billableHours: billable,
      costs: 0,
      fees: {},
      profitMargin: 20,
      people: 1,
    });
    expect(b.rate).toBeGreaterThan(a.rate);
    // 20% margin → net needs to be 1.2× → rate scales 1.2×
    expect(b.rate / a.rate).toBeCloseTo(1.2, 5);
  });

  it('round-trip with costs + fees + profit margin', () => {
    const fees = {platformFee: 15, processorFee: 2.9, incomeTax: 0};
    const target = 90000;
    const costs = 18000;
    const profitMargin = 15;
    const r = requiredRateForTakeHome({
      targetIncome: target,
      billableHours: billable,
      costs,
      fees,
      profitMargin,
      people: 2,
    });
    const back = incomeForRate({
      rate: r.rate,
      billableHours: billable,
      costs,
      fees,
      people: 2,
    });
    // The build-rate should have the team produce target × (1 + margin)
    // after costs and fees.
    expect(back.annual.net).toBeCloseTo(target * (1 + profitMargin / 100), 3);
  });

  it('zero billable hours → infinite rate', () => {
    const r = requiredRateForTakeHome({
      targetIncome: 100000,
      billableHours: 0,
      costs: 0,
      fees: {},
      people: 1,
    });
    expect(r.rate).toBe(Infinity);
  });

  it('100% fees → infinite rate', () => {
    const r = requiredRateForTakeHome({
      targetIncome: 1,
      billableHours: 100,
      costs: 0,
      fees: {incomeTax: 100},
      people: 1,
    });
    expect(r.rate).toBe(Infinity);
  });
});
