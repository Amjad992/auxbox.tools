import {describe, it, expect} from 'vitest';
import {formatHMSms, formatTitleTime, computeElapsed, lapDelta} from './utils';
import {STATUS} from './constants';

describe('formatHMSms', () => {
  it('formats 0 ms as 00:00.000', () => {
    expect(formatHMSms(0)).toBe('00:00.000');
  });

  it('formats 999 ms as 00:00.999', () => {
    expect(formatHMSms(999)).toBe('00:00.999');
  });

  it('formats exactly 1000 ms as 00:01.000', () => {
    expect(formatHMSms(1000)).toBe('00:01.000');
  });

  it('formats 60_000 ms as 01:00.000', () => {
    expect(formatHMSms(60_000)).toBe('01:00.000');
  });

  it('formats 3_599_999 ms with no hours field', () => {
    expect(formatHMSms(3_599_999)).toBe('59:59.999');
  });

  it('rolls over to HH at exactly 3_600_000 ms', () => {
    expect(formatHMSms(3_600_000)).toBe('01:00:00.000');
  });

  it('formats a long session correctly', () => {
    // 1h 02m 03s 456ms
    const ms = 3600_000 + 2 * 60_000 + 3 * 1000 + 456;
    expect(formatHMSms(ms)).toBe('01:02:03.456');
  });

  it('clamps negative input to 0', () => {
    expect(formatHMSms(-5)).toBe('00:00.000');
  });

  it('handles non-finite as 0', () => {
    expect(formatHMSms(NaN)).toBe('00:00.000');
    expect(formatHMSms(Infinity)).toBe('00:00.000');
  });
});

describe('formatTitleTime', () => {
  it('formats 0 ms as 0:00', () => {
    expect(formatTitleTime(0)).toBe('0:00');
  });
  it('drops sub-second precision', () => {
    expect(formatTitleTime(23_456)).toBe('0:23');
  });
  it('rolls over to hours past 1 hour', () => {
    expect(formatTitleTime(3_600_000 + 2 * 60_000 + 35_000)).toBe('1:02:35');
  });
});

describe('computeElapsed', () => {
  it('returns 0 for idle state', () => {
    expect(
      computeElapsed(
        {status: STATUS.IDLE, startedAt: null, accumulatedMs: 0},
        1_000_000
      )
    ).toBe(0);
  });

  it('returns accumulatedMs for paused state', () => {
    expect(
      computeElapsed(
        {status: STATUS.PAUSED, startedAt: null, accumulatedMs: 12_345},
        2_000_000
      )
    ).toBe(12_345);
  });

  it('returns accumulatedMs + (now - startedAt) for running state', () => {
    expect(
      computeElapsed(
        {status: STATUS.RUNNING, startedAt: 1_000_000, accumulatedMs: 5_000},
        1_007_500
      )
    ).toBe(12_500);
  });

  it('clamps a negative wall-clock delta (clock skew) at 0', () => {
    expect(
      computeElapsed(
        {status: STATUS.RUNNING, startedAt: 2_000_000, accumulatedMs: 1_000},
        1_999_000
      )
    ).toBe(1_000);
  });

  it('returns 0 when state is null', () => {
    expect(computeElapsed(null, 1_000)).toBe(0);
  });
});

describe('lapDelta', () => {
  it('returns currentElapsed when no previous lap', () => {
    expect(lapDelta(5_000, 0)).toBe(5_000);
  });

  it('returns difference between current and last lap', () => {
    expect(lapDelta(7_500, 5_000)).toBe(2_500);
  });

  it('clamps negative deltas to 0', () => {
    expect(lapDelta(3_000, 5_000)).toBe(0);
  });

  it('handles non-finite last as 0', () => {
    expect(lapDelta(1_000, NaN)).toBe(1_000);
  });
});
