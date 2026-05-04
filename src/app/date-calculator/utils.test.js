import {describe, it, expect} from 'vitest';
import {DateTime} from 'luxon';
import {
  parseISODate,
  compareDates,
  swapIfReversed,
  diffYMD,
  totalDaysBetween,
  totalUnits,
  totalWorkingUnits,
  workingDaysBetween,
} from './utils';

// Convenience: build a Luxon DateTime at midnight local from an ISO string.
function dt(isoStr) {
  return DateTime.fromISO(isoStr).startOf('day');
}

describe('parseISODate', () => {
  it('parses a valid yyyy-mm-dd string into a DateTime', () => {
    const result = parseISODate('2024-01-15');
    expect(result).not.toBeNull();
    expect(result.year).toBe(2024);
    expect(result.month).toBe(1);
    expect(result.day).toBe(15);
  });

  it('parses leap-day correctly', () => {
    const result = parseISODate('2024-02-29');
    expect(result).not.toBeNull();
    expect(result.day).toBe(29);
  });

  it('returns null for malformed input', () => {
    expect(parseISODate('')).toBeNull();
    expect(parseISODate('not-a-date')).toBeNull();
    expect(parseISODate('2024/01/15')).toBeNull();
    expect(parseISODate('2024-1-15')).toBeNull();
    expect(parseISODate(null)).toBeNull();
    expect(parseISODate(undefined)).toBeNull();
    expect(parseISODate(123)).toBeNull();
  });

  it('rejects out-of-range month', () => {
    expect(parseISODate('2024-13-01')).toBeNull();
    expect(parseISODate('2024-00-01')).toBeNull();
  });

  it('rejects out-of-range day', () => {
    expect(parseISODate('2024-01-32')).toBeNull();
    expect(parseISODate('2024-01-00')).toBeNull();
    expect(parseISODate('2024-02-30')).toBeNull();
    expect(parseISODate('2023-02-29')).toBeNull();
    expect(parseISODate('2024-04-31')).toBeNull();
  });
});

describe('compareDates', () => {
  it('returns 0 for equal dates', () => {
    expect(compareDates(dt('2024-01-15'), dt('2024-01-15'))).toBe(0);
  });

  it('returns -1 when a < b', () => {
    expect(compareDates(dt('2023-01-15'), dt('2024-01-15'))).toBe(-1);
    expect(compareDates(dt('2024-01-15'), dt('2024-02-15'))).toBe(-1);
    expect(compareDates(dt('2024-01-14'), dt('2024-01-15'))).toBe(-1);
  });

  it('returns 1 when a > b', () => {
    expect(compareDates(dt('2025-01-15'), dt('2024-01-15'))).toBe(1);
  });
});

describe('swapIfReversed', () => {
  it('passes through when start <= end', () => {
    const start = dt('2024-01-15');
    const end = dt('2024-02-15');
    const result = swapIfReversed(start, end);
    expect(result.start.toISODate()).toBe('2024-01-15');
    expect(result.end.toISODate()).toBe('2024-02-15');
    expect(result.swapped).toBe(false);
  });

  it('swaps when end < start, sets swapped=true', () => {
    const start = dt('2024-02-15');
    const end = dt('2024-01-15');
    const result = swapIfReversed(start, end);
    expect(result.start.toISODate()).toBe('2024-01-15');
    expect(result.end.toISODate()).toBe('2024-02-15');
    expect(result.swapped).toBe(true);
  });

  it('passes through equal dates with swapped=false', () => {
    const d = dt('2024-01-15');
    const result = swapIfReversed(d, d);
    expect(result.swapped).toBe(false);
  });
});

describe('diffYMD', () => {
  it('returns {0,0,0} for the same date', () => {
    expect(diffYMD(dt('2024-01-15'), dt('2024-01-15'))).toEqual({years: 0, months: 0, days: 0});
  });

  it('returns exactly one year for a one-year span', () => {
    expect(diffYMD(dt('2024-01-15'), dt('2025-01-15'))).toEqual({years: 1, months: 0, days: 0});
  });

  it('handles end-of-month borrow: 2024-01-31 -> 2024-02-28 = 28 days', () => {
    expect(diffYMD(dt('2024-01-31'), dt('2024-02-28'))).toEqual({years: 0, months: 0, days: 28});
  });

  it('returns exactly four years across leap-day to leap-day', () => {
    expect(diffYMD(dt('2020-02-29'), dt('2024-02-29'))).toEqual({years: 4, months: 0, days: 0});
  });

  it('handles cross-year borrow (2023-03-15 -> 2024-02-10)', () => {
    // 0 years, 10 months, 26 days
    expect(diffYMD(dt('2023-03-15'), dt('2024-02-10'))).toEqual({years: 0, months: 10, days: 26});
  });

  it('handles month rollover borrow trap (2024-01-31 -> 2024-03-01)', () => {
    // Java Period.between convention: 0 years, 1 month, 1 day.
    // Luxon produces the same result with longterm accuracy.
    expect(diffYMD(dt('2024-01-31'), dt('2024-03-01'))).toEqual({years: 0, months: 1, days: 1});
  });
});

describe('totalDaysBetween', () => {
  it('returns 0 for the same date', () => {
    expect(totalDaysBetween(dt('2024-01-15'), dt('2024-01-15'))).toBe(0);
  });

  it('returns 1 for a single-day span', () => {
    expect(totalDaysBetween(dt('2024-01-15'), dt('2024-01-16'))).toBe(1);
  });

  it('counts a leap-year span correctly (2020 has 366 days)', () => {
    expect(totalDaysBetween(dt('2020-01-01'), dt('2021-01-01'))).toBe(366);
  });

  it('counts a non-leap year correctly (2023 has 365 days)', () => {
    expect(totalDaysBetween(dt('2023-01-01'), dt('2024-01-01'))).toBe(365);
  });

  it('returns an integer for a span crossing DST', () => {
    // March 8 2024 → March 11 2024 (US DST starts March 10) — 3 days.
    const result = totalDaysBetween(dt('2024-03-08'), dt('2024-03-11'));
    expect(result).toBe(3);
    expect(Number.isInteger(result)).toBe(true);
  });
});

describe('totalUnits', () => {
  it('derives weeks/hours/minutes from days', () => {
    const result = totalUnits(dt('2024-01-01'), dt('2024-01-15'));
    expect(result.days).toBe(14);
    expect(result.weeks).toBe(2);
    expect(result.weekRemainderDays).toBe(0);
    expect(result.hours).toBe(14 * 24);
    expect(result.minutes).toBe(14 * 1440);
  });

  it('handles a remainder for non-multiple-of-7 day counts', () => {
    const result = totalUnits(dt('2024-01-01'), dt('2024-01-11'));
    expect(result.days).toBe(10);
    expect(result.weeks).toBe(1);
    expect(result.weekRemainderDays).toBe(3);
  });
});

describe('totalWorkingUnits', () => {
  it('returns {0, 0, 0} for 0 working days', () => {
    expect(totalWorkingUnits(0)).toEqual({workingDays: 0, workingHours: 0, workingMinutes: 0});
  });

  it('returns {1, 8, 480} for 1 working day', () => {
    expect(totalWorkingUnits(1)).toEqual({workingDays: 1, workingHours: 8, workingMinutes: 480});
  });

  it('returns {5, 40, 2400} for 5 working days', () => {
    expect(totalWorkingUnits(5)).toEqual({workingDays: 5, workingHours: 40, workingMinutes: 2400});
  });
});

describe('workingDaysBetween', () => {
  it('counts a Mon-Fri span (Mon to Fri inclusive = 5 weekdays)', () => {
    // 2024-01-15 (Mon) to 2024-01-19 (Fri).
    expect(workingDaysBetween(dt('2024-01-15'), dt('2024-01-19'))).toBe(5);
  });

  it('excludes weekends in a span starting Saturday', () => {
    // 2024-01-13 (Sat) to 2024-01-19 (Fri) — Sat, Sun, then Mon-Fri = 5.
    expect(workingDaysBetween(dt('2024-01-13'), dt('2024-01-19'))).toBe(5);
  });

  it('excludes weekend tail when span ends Sunday', () => {
    // 2024-01-15 (Mon) to 2024-01-21 (Sun) — Mon-Fri = 5.
    expect(workingDaysBetween(dt('2024-01-15'), dt('2024-01-21'))).toBe(5);
  });

  it('returns 0 for a span entirely within a weekend', () => {
    // 2024-01-13 (Sat) to 2024-01-14 (Sun).
    expect(workingDaysBetween(dt('2024-01-13'), dt('2024-01-14'))).toBe(0);
  });

  it('returns 1 for a single weekday (start === end Mon)', () => {
    // 2024-01-15 (Mon) — single-day span = 1 working day.
    expect(workingDaysBetween(dt('2024-01-15'), dt('2024-01-15'))).toBe(1);
  });

  it('returns 0 for a single-day weekend (start === end Sat)', () => {
    expect(workingDaysBetween(dt('2024-01-13'), dt('2024-01-13'))).toBe(0);
  });

  it('100-year span: 2000-01-01 (Sat) to 2100-01-01 (Fri) = 26090 working days', () => {
    // 36525 total days / 7 = 5217 full weeks + 6 remainder
    // startWeekday = 6 (Sat); days Sat/Sun/Mon/Tue/Wed/Thu/Fri → 5 weekdays in remainder
    // 5217 * 5 + 5 = 26090
    expect(workingDaysBetween(dt('2000-01-01'), dt('2100-01-01'))).toBe(26090);
  });
});
