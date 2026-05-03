import { describe, it, expect } from 'vitest';
import {
  periodFactor,
  toAnnual,
  fromAnnual,
  parseNumeric,
  formatNumber,
  deriveRaiseAnnual,
  deriveRaisePercent,
} from './utils';
import { WEEKS_PER_YEAR, MONTHS_PER_YEAR } from './constants';

describe('periodFactor', () => {
  it('hourly multiplies hpw by weeks-per-year', () => {
    expect(periodFactor('hourly', 40)).toBe(40 * WEEKS_PER_YEAR);
  });

  it('hourly with 0/undefined hpw returns 0', () => {
    expect(periodFactor('hourly', 0)).toBe(0);
    expect(periodFactor('hourly', undefined)).toBe(0);
  });

  it('weekly returns weeks-per-year', () => {
    expect(periodFactor('weekly')).toBe(WEEKS_PER_YEAR);
  });

  it('monthly returns months-per-year', () => {
    expect(periodFactor('monthly')).toBe(MONTHS_PER_YEAR);
  });

  it('annual returns 1', () => {
    expect(periodFactor('annual')).toBe(1);
  });

  it('unknown period defaults to 1', () => {
    expect(periodFactor('weird')).toBe(1);
  });
});

describe('toAnnual / fromAnnual', () => {
  it('round-trips a value through annualization', () => {
    const v = 25;
    const a = toAnnual(v, 'hourly', 40);
    expect(fromAnnual(a, 'hourly', 40)).toBeCloseTo(v, 6);
  });

  it('toAnnual hourly with 40 hpw matches 40*52*rate', () => {
    expect(toAnnual(25, 'hourly', 40)).toBe(25 * 40 * WEEKS_PER_YEAR);
  });

  it('fromAnnual returns 0 when factor is 0 (e.g., hourly with 0 hpw)', () => {
    expect(fromAnnual(50000, 'hourly', 0)).toBe(0);
  });

  it('fromAnnual annual is identity', () => {
    expect(fromAnnual(50000, 'annual', 40)).toBe(50000);
  });

  it('toAnnual monthly multiplies by 12', () => {
    expect(toAnnual(5000, 'monthly', 40)).toBe(5000 * 12);
  });
});

describe('parseNumeric', () => {
  it.each([
    ['', null],
    [null, null],
    [undefined, null],
    ['-', null],
    ['.', null],
    ['  ', null],
    ['abc', null],
  ])('parseNumeric(%p) -> %p', (input, expected) => {
    expect(parseNumeric(input)).toBe(expected);
  });

  it('strips commas from grouped numbers', () => {
    expect(parseNumeric('1,234.56')).toBe(1234.56);
    expect(parseNumeric('1,000,000')).toBe(1_000_000);
  });

  it('parses plain numbers and numeric strings', () => {
    expect(parseNumeric('42')).toBe(42);
    expect(parseNumeric(42)).toBe(42);
    expect(parseNumeric('3.14')).toBe(3.14);
  });

  it('rejects Infinity / NaN inputs', () => {
    expect(parseNumeric('Infinity')).toBe(null);
    expect(parseNumeric('NaN')).toBe(null);
  });
});

describe('formatNumber', () => {
  it('returns empty string for null/undefined/non-finite', () => {
    expect(formatNumber(null)).toBe('');
    expect(formatNumber(undefined)).toBe('');
    expect(formatNumber(NaN)).toBe('');
    expect(formatNumber(Infinity)).toBe('');
  });

  it('returns "0" for zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('strips trailing zeros after rounding to 2 decimals', () => {
    expect(formatNumber(1.5)).toBe('1.5');
    expect(formatNumber(1.0)).toBe('1');
    expect(formatNumber(1.234)).toBe('1.23');
    expect(formatNumber(1.235)).toBe('1.24'); // rounds half up
  });

  it('keeps integer-only output for whole numbers', () => {
    expect(formatNumber(42)).toBe('42');
  });
});

describe('deriveRaiseAnnual', () => {
  it('returns the percent of beforeAnnual when mode is "percent"', () => {
    expect(
      deriveRaiseAnnual({ beforeAnnual: 50000, raiseMode: 'percent', raiseValue: 10 })
    ).toBe(5000);
  });

  it('returns raiseValue directly when mode is "amount"', () => {
    expect(
      deriveRaiseAnnual({ beforeAnnual: 50000, raiseMode: 'amount', raiseValue: 7500 })
    ).toBe(7500);
  });

  it('returns 0 when mode is null', () => {
    expect(
      deriveRaiseAnnual({ beforeAnnual: 50000, raiseMode: null, raiseValue: 0 })
    ).toBe(0);
  });
});

describe('deriveRaisePercent', () => {
  it('returns raiseValue when mode is "percent"', () => {
    expect(
      deriveRaisePercent({ beforeAnnual: 50000, raiseMode: 'percent', raiseValue: 8 })
    ).toBe(8);
  });

  it('returns the implied percent when mode is "amount" and beforeAnnual is set', () => {
    expect(
      deriveRaisePercent({ beforeAnnual: 50000, raiseMode: 'amount', raiseValue: 5000 })
    ).toBeCloseTo(10, 6);
  });

  it('returns null when mode is "amount" and beforeAnnual is 0/missing', () => {
    expect(
      deriveRaisePercent({ beforeAnnual: 0, raiseMode: 'amount', raiseValue: 5000 })
    ).toBeNull();
  });

  it('returns null when mode is null', () => {
    expect(
      deriveRaisePercent({ beforeAnnual: 50000, raiseMode: null, raiseValue: 0 })
    ).toBeNull();
  });
});
