import {describe, it, expect} from 'vitest';
import {
  parseISODate,
  compareDates,
  swapIfReversed,
  diffYMD,
  totalDaysBetween,
  totalUnits,
  workingDaysBetween,
} from './utils';

describe('parseISODate', () => {
  it('parses a valid yyyy-mm-dd string', () => {
    expect(parseISODate('2024-01-15')).toEqual({year: 2024, month: 1, day: 15});
  });

  it('parses leap-day correctly', () => {
    expect(parseISODate('2024-02-29')).toEqual({year: 2024, month: 2, day: 29});
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
    // Feb 30 doesn't exist.
    expect(parseISODate('2024-02-30')).toBeNull();
    // Feb 29 in a non-leap year.
    expect(parseISODate('2023-02-29')).toBeNull();
    // April has 30 days.
    expect(parseISODate('2024-04-31')).toBeNull();
  });
});

describe('compareDates', () => {
  it('returns 0 for equal dates', () => {
    expect(
      compareDates({year: 2024, month: 1, day: 15}, {year: 2024, month: 1, day: 15})
    ).toBe(0);
  });

  it('returns -1 when a < b', () => {
    expect(
      compareDates({year: 2023, month: 1, day: 15}, {year: 2024, month: 1, day: 15})
    ).toBe(-1);
    expect(
      compareDates({year: 2024, month: 1, day: 15}, {year: 2024, month: 2, day: 15})
    ).toBe(-1);
    expect(
      compareDates({year: 2024, month: 1, day: 14}, {year: 2024, month: 1, day: 15})
    ).toBe(-1);
  });

  it('returns 1 when a > b', () => {
    expect(
      compareDates({year: 2025, month: 1, day: 15}, {year: 2024, month: 1, day: 15})
    ).toBe(1);
  });
});

describe('swapIfReversed', () => {
  it('passes through when start <= end', () => {
    const start = {year: 2024, month: 1, day: 15};
    const end = {year: 2024, month: 2, day: 15};
    const result = swapIfReversed(start, end);
    expect(result.start).toEqual(start);
    expect(result.end).toEqual(end);
    expect(result.swapped).toBe(false);
  });

  it('swaps when end < start, sets swapped=true', () => {
    const start = {year: 2024, month: 2, day: 15};
    const end = {year: 2024, month: 1, day: 15};
    const result = swapIfReversed(start, end);
    expect(result.start).toEqual(end);
    expect(result.end).toEqual(start);
    expect(result.swapped).toBe(true);
  });

  it('passes through equal dates with swapped=false', () => {
    const d = {year: 2024, month: 1, day: 15};
    const result = swapIfReversed(d, d);
    expect(result.swapped).toBe(false);
  });
});

describe('diffYMD', () => {
  it('returns {0,0,0} for the same date', () => {
    const d = {year: 2024, month: 1, day: 15};
    expect(diffYMD(d, d)).toEqual({years: 0, months: 0, days: 0});
  });

  it('returns exactly one year for a one-year span', () => {
    expect(
      diffYMD(
        {year: 2024, month: 1, day: 15},
        {year: 2025, month: 1, day: 15}
      )
    ).toEqual({years: 1, months: 0, days: 0});
  });

  it('handles end-of-month borrow: 2024-01-31 -> 2024-02-28 = 28 days', () => {
    expect(
      diffYMD(
        {year: 2024, month: 1, day: 31},
        {year: 2024, month: 2, day: 28}
      )
    ).toEqual({years: 0, months: 0, days: 28});
  });

  it('returns exactly four years across leap-day to leap-day', () => {
    expect(
      diffYMD(
        {year: 2020, month: 2, day: 29},
        {year: 2024, month: 2, day: 29}
      )
    ).toEqual({years: 4, months: 0, days: 0});
  });

  it('handles cross-year borrow (2023-03-15 -> 2024-02-10)', () => {
    // From 2023-03-15 to 2024-02-10:
    //   years: 1, months: -1 → borrow 1 year → 0 years, 11 months
    //   end day (10) < start day (15) → borrow days from January (31)
    //   days: 10 - 15 + 31 = 26 → months become 10
    // Result: 0 years, 10 months, 26 days
    expect(
      diffYMD(
        {year: 2023, month: 3, day: 15},
        {year: 2024, month: 2, day: 10}
      )
    ).toEqual({years: 0, months: 10, days: 26});
  });

  it('handles month rollover where end day < start day within same year', () => {
    // 2024-01-31 -> 2024-03-01:
    //   years 0, months 2, days = 1 - 31 → borrow February (29 days in 2024)
    //   days: 1 - 31 + 29 = -1 → still negative, this is the canonical edge
    //   Standard algorithm uses days-in-the-borrowed-month (the month before end month).
    //   borrow month is February (month 2 of 2024) with 29 days.
    //   days: 1 + 29 - 31 = -1 → result needs another borrow? No: with a single-borrow
    //   algorithm the canonical result is months: 1, days: 1+29-31 = -1.
    //   Our reference implementation uses the days-in-prev-month approach:
    //   prev month for end (March) is February → 29 days in 2024.
    //   days = endDay + daysInPrevMonth - startDay = 1 + 29 - 31 = -1
    //   Hmm — if a tool produces -1, that's wrong. The fix is to also adjust when days
    //   came out negative; many implementations re-borrow by going back one more month.
    //   Industry convention (Java Period.between): 2024-01-31 -> 2024-03-01 = 1 month 1 day.
    //   Reasoning: subtract one month → 2024-02-01 to 2024-03-01 = exactly 1 month 0 days,
    //   plus 2024-01-31 to 2024-02-01 = 1 day. So total = 1 month 1 day.
    expect(
      diffYMD(
        {year: 2024, month: 1, day: 31},
        {year: 2024, month: 3, day: 1}
      )
    ).toEqual({years: 0, months: 1, days: 1});
  });
});

describe('totalDaysBetween', () => {
  it('returns 0 for the same date', () => {
    const d = {year: 2024, month: 1, day: 15};
    expect(totalDaysBetween(d, d)).toBe(0);
  });

  it('returns 1 for a single-day span', () => {
    expect(
      totalDaysBetween(
        {year: 2024, month: 1, day: 15},
        {year: 2024, month: 1, day: 16}
      )
    ).toBe(1);
  });

  it('counts a leap-year span correctly (2020 has 366 days)', () => {
    expect(
      totalDaysBetween(
        {year: 2020, month: 1, day: 1},
        {year: 2021, month: 1, day: 1}
      )
    ).toBe(366);
  });

  it('counts a non-leap year correctly (2023 has 365 days)', () => {
    expect(
      totalDaysBetween(
        {year: 2023, month: 1, day: 1},
        {year: 2024, month: 1, day: 1}
      )
    ).toBe(365);
  });

  it('returns an integer for a span crossing DST (UTC-based math)', () => {
    // March 8 2024 → March 11 2024 (US DST starts March 10) — 3 days, no half-day.
    const result = totalDaysBetween(
      {year: 2024, month: 3, day: 8},
      {year: 2024, month: 3, day: 11}
    );
    expect(result).toBe(3);
    expect(Number.isInteger(result)).toBe(true);
  });
});

describe('totalUnits', () => {
  it('derives weeks/hours/minutes from days', () => {
    const result = totalUnits(
      {year: 2024, month: 1, day: 1},
      {year: 2024, month: 1, day: 15}
    );
    expect(result.days).toBe(14);
    expect(result.weeks).toBe(2);
    expect(result.weekRemainderDays).toBe(0);
    expect(result.hours).toBe(14 * 24);
    expect(result.minutes).toBe(14 * 1440);
  });

  it('handles a remainder for non-multiple-of-7 day counts', () => {
    const result = totalUnits(
      {year: 2024, month: 1, day: 1},
      {year: 2024, month: 1, day: 11}
    );
    expect(result.days).toBe(10);
    expect(result.weeks).toBe(1);
    expect(result.weekRemainderDays).toBe(3);
  });
});

describe('workingDaysBetween', () => {
  it('counts a Mon-Fri span (Mon to Fri inclusive of both = 5 weekdays)', () => {
    // 2024-01-15 (Mon) to 2024-01-19 (Fri).
    expect(
      workingDaysBetween(
        {year: 2024, month: 1, day: 15},
        {year: 2024, month: 1, day: 19}
      )
    ).toBe(5);
  });

  it('excludes weekends in a span starting Saturday', () => {
    // 2024-01-13 (Sat) to 2024-01-19 (Fri) — Sat, Sun, then Mon-Fri = 5.
    expect(
      workingDaysBetween(
        {year: 2024, month: 1, day: 13},
        {year: 2024, month: 1, day: 19}
      )
    ).toBe(5);
  });

  it('excludes weekend tail when span ends Sunday', () => {
    // 2024-01-15 (Mon) to 2024-01-21 (Sun) — Mon-Fri = 5.
    expect(
      workingDaysBetween(
        {year: 2024, month: 1, day: 15},
        {year: 2024, month: 1, day: 21}
      )
    ).toBe(5);
  });

  it('returns 0 for a span entirely within a weekend', () => {
    // 2024-01-13 (Sat) to 2024-01-14 (Sun).
    expect(
      workingDaysBetween(
        {year: 2024, month: 1, day: 13},
        {year: 2024, month: 1, day: 14}
      )
    ).toBe(0);
  });

  it('returns 1 for a single weekday (start === end Mon)', () => {
    // 2024-01-15 (Mon) — single-day span = 1 working day.
    expect(
      workingDaysBetween(
        {year: 2024, month: 1, day: 15},
        {year: 2024, month: 1, day: 15}
      )
    ).toBe(1);
  });

  it('returns 0 for a single-day weekend (start === end Sat)', () => {
    expect(
      workingDaysBetween(
        {year: 2024, month: 1, day: 13},
        {year: 2024, month: 1, day: 13}
      )
    ).toBe(0);
  });
});
