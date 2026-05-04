import {describe, it, expect} from 'vitest';
import {
  durationFor,
  nextPhase,
  elapsedSoFar,
  computeRemaining,
  formatRemaining,
  incrementToday,
  last7Days,
  todayCount,
} from './utils';
import {DEFAULT_SETTINGS, PHASE, STATUS} from './constants';

describe('durationFor', () => {
  it('returns workMinutes * 60_000 for work', () => {
    expect(durationFor(PHASE.WORK, DEFAULT_SETTINGS)).toBe(25 * 60_000);
  });
  it('returns shortBreakMinutes * 60_000 for shortBreak', () => {
    expect(durationFor(PHASE.SHORT_BREAK, DEFAULT_SETTINGS)).toBe(5 * 60_000);
  });
  it('returns longBreakMinutes * 60_000 for longBreak', () => {
    expect(durationFor(PHASE.LONG_BREAK, DEFAULT_SETTINGS)).toBe(15 * 60_000);
  });
  it('returns 0 for an unknown phase', () => {
    expect(durationFor('???', DEFAULT_SETTINGS)).toBe(0);
  });
  it('clamps negative or non-finite minute values to 0', () => {
    expect(durationFor(PHASE.WORK, {...DEFAULT_SETTINGS, workMinutes: -5})).toBe(0);
    expect(durationFor(PHASE.WORK, {...DEFAULT_SETTINGS, workMinutes: NaN})).toBe(0);
  });
});

describe('nextPhase', () => {
  it('after 0 completed work sessions: work → shortBreak', () => {
    expect(nextPhase(PHASE.WORK, 0, 4)).toBe(PHASE.SHORT_BREAK);
  });
  it('after 3 completed work sessions: the 4th completion → longBreak', () => {
    expect(nextPhase(PHASE.WORK, 3, 4)).toBe(PHASE.LONG_BREAK);
  });
  it('after 7 completed work sessions: the 8th completion → longBreak', () => {
    expect(nextPhase(PHASE.WORK, 7, 4)).toBe(PHASE.LONG_BREAK);
  });
  it('after 1, 2 completed: short break', () => {
    expect(nextPhase(PHASE.WORK, 1, 4)).toBe(PHASE.SHORT_BREAK);
    expect(nextPhase(PHASE.WORK, 2, 4)).toBe(PHASE.SHORT_BREAK);
  });
  it('cadence of 2: every other completion is a long break', () => {
    expect(nextPhase(PHASE.WORK, 0, 2)).toBe(PHASE.SHORT_BREAK);
    expect(nextPhase(PHASE.WORK, 1, 2)).toBe(PHASE.LONG_BREAK);
    expect(nextPhase(PHASE.WORK, 2, 2)).toBe(PHASE.SHORT_BREAK);
    expect(nextPhase(PHASE.WORK, 3, 2)).toBe(PHASE.LONG_BREAK);
  });
  it('shortBreak → work', () => {
    expect(nextPhase(PHASE.SHORT_BREAK, 5, 4)).toBe(PHASE.WORK);
  });
  it('longBreak → work', () => {
    expect(nextPhase(PHASE.LONG_BREAK, 5, 4)).toBe(PHASE.WORK);
  });
  it('treats invalid cadence as 1 (every completion is long)', () => {
    expect(nextPhase(PHASE.WORK, 0, 0)).toBe(PHASE.LONG_BREAK);
    expect(nextPhase(PHASE.WORK, 0, NaN)).toBe(PHASE.LONG_BREAK);
  });
});

describe('elapsedSoFar', () => {
  it('returns 0 for idle', () => {
    expect(
      elapsedSoFar(
        {status: STATUS.IDLE, startedAt: null, accumulatedMs: 0},
        1_000_000
      )
    ).toBe(0);
  });
  it('returns accumulatedMs for paused', () => {
    expect(
      elapsedSoFar(
        {status: STATUS.PAUSED, startedAt: null, accumulatedMs: 12_345},
        2_000_000
      )
    ).toBe(12_345);
  });
  it('returns accumulated + (now - startedAt) for running', () => {
    expect(
      elapsedSoFar(
        {status: STATUS.RUNNING, startedAt: 1_000_000, accumulatedMs: 5_000},
        1_007_500
      )
    ).toBe(12_500);
  });
  it('clamps a negative wall-clock delta at 0', () => {
    expect(
      elapsedSoFar(
        {status: STATUS.RUNNING, startedAt: 2_000_000, accumulatedMs: 1_000},
        1_999_000
      )
    ).toBe(1_000);
  });
});

describe('computeRemaining', () => {
  it('returns full duration when idle', () => {
    expect(
      computeRemaining(
        {phase: PHASE.WORK, status: STATUS.IDLE, startedAt: null, accumulatedMs: 0},
        1_000_000,
        DEFAULT_SETTINGS
      )
    ).toBe(25 * 60_000);
  });
  it('returns duration - accumulated when paused', () => {
    expect(
      computeRemaining(
        {phase: PHASE.WORK, status: STATUS.PAUSED, startedAt: null, accumulatedMs: 60_000},
        1_000_000,
        DEFAULT_SETTINGS
      )
    ).toBe(24 * 60_000);
  });
  it('returns duration - elapsed for running', () => {
    expect(
      computeRemaining(
        {
          phase: PHASE.SHORT_BREAK,
          status: STATUS.RUNNING,
          startedAt: 1_000_000,
          accumulatedMs: 0,
        },
        1_000_000 + 60_000,
        DEFAULT_SETTINGS
      )
    ).toBe(4 * 60_000);
  });
  it('clamps to 0 once the phase has completed', () => {
    expect(
      computeRemaining(
        {
          phase: PHASE.WORK,
          status: STATUS.RUNNING,
          startedAt: 1_000_000,
          accumulatedMs: 0,
        },
        1_000_000 + 26 * 60_000,
        DEFAULT_SETTINGS
      )
    ).toBe(0);
  });
});

describe('formatRemaining', () => {
  it('formats the full work duration as 25:00', () => {
    expect(formatRemaining(25 * 60_000)).toBe('25:00');
  });
  it('rounds up sub-second remaining', () => {
    expect(formatRemaining(1)).toBe('00:01');
    expect(formatRemaining(999)).toBe('00:01');
  });
  it('formats 0 as 00:00', () => {
    expect(formatRemaining(0)).toBe('00:00');
    expect(formatRemaining(-100)).toBe('00:00');
  });
  it('formats > 1 hour with hours field', () => {
    // 61 minutes = 1:01:00
    expect(formatRemaining(61 * 60_000)).toBe('1:01:00');
  });
  it('handles non-finite as 00:00', () => {
    expect(formatRemaining(NaN)).toBe('00:00');
  });
});

describe('incrementToday', () => {
  it('creates a new entry on first completion', () => {
    expect(incrementToday({}, '2026-05-04')).toEqual({
      '2026-05-04': {completedPomodoros: 1},
    });
  });
  it('increments an existing entry', () => {
    const next = incrementToday(
      {'2026-05-04': {completedPomodoros: 3}},
      '2026-05-04'
    );
    expect(next['2026-05-04'].completedPomodoros).toBe(4);
  });
  it('creates a new key on a different date (rollover)', () => {
    const start = {'2026-05-03': {completedPomodoros: 7}};
    const next = incrementToday(start, '2026-05-04');
    expect(next['2026-05-03'].completedPomodoros).toBe(7);
    expect(next['2026-05-04'].completedPomodoros).toBe(1);
  });
  it('does not mutate the input', () => {
    const start = {'2026-05-04': {completedPomodoros: 1}};
    incrementToday(start, '2026-05-04');
    expect(start['2026-05-04'].completedPomodoros).toBe(1);
  });
  it('returns input unchanged for an invalid todayIso', () => {
    const start = {'2026-05-04': {completedPomodoros: 2}};
    expect(incrementToday(start, '')).toEqual(start);
    expect(incrementToday(start, null)).toEqual(start);
  });
});

describe('last7Days', () => {
  it('returns 7 entries oldest-first ending on today', () => {
    const out = last7Days({}, '2026-05-04');
    expect(out).toHaveLength(7);
    expect(out[0].date).toBe('2026-04-28');
    expect(out[6].date).toBe('2026-05-04');
    expect(out.every((d) => d.count === 0)).toBe(true);
  });

  it('reflects counts when present and zero-fills missing days', () => {
    const history = {
      '2026-05-02': {completedPomodoros: 4},
      '2026-05-04': {completedPomodoros: 2},
    };
    const out = last7Days(history, '2026-05-04');
    const map = Object.fromEntries(out.map((d) => [d.date, d.count]));
    expect(map['2026-05-02']).toBe(4);
    expect(map['2026-05-04']).toBe(2);
    expect(map['2026-05-03']).toBe(0);
    expect(map['2026-04-30']).toBe(0);
  });

  it('returns [] for an invalid todayIso', () => {
    expect(last7Days({}, 'not-a-date')).toEqual([]);
  });
});

describe('todayCount', () => {
  it('returns the count for the matching ISO key', () => {
    expect(
      todayCount({'2026-05-04': {completedPomodoros: 3}}, '2026-05-04')
    ).toBe(3);
  });
  it('returns 0 when no entry for today', () => {
    expect(todayCount({}, '2026-05-04')).toBe(0);
  });
  it('returns 0 for invalid input', () => {
    expect(todayCount(null, '2026-05-04')).toBe(0);
    expect(todayCount({}, '')).toBe(0);
  });
});
