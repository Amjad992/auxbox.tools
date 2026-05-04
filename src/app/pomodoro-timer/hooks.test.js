import {describe, it, expect} from 'vitest';
import {act, renderHook} from '@testing-library/react';
import {usePomodoro} from './hooks';
import {DEFAULT_SETTINGS, PHASE, STATUS} from './constants';

function makeNow() {
  let t = 1_700_000_000_000;
  return {
    now: () => t,
    advance: (ms) => {
      t += ms;
    },
  };
}

describe('usePomodoro — start/pause', () => {
  it('starts running and tracks startedAt', () => {
    const clock = makeNow();
    const {result} = renderHook(() => usePomodoro({now: clock.now}));
    act(() => result.current.start());
    expect(result.current.runtime.status).toBe(STATUS.RUNNING);
    expect(result.current.runtime.startedAt).toBe(1_700_000_000_000);
  });

  it('pause snapshots accumulatedMs and clears startedAt', () => {
    const clock = makeNow();
    const {result} = renderHook(() => usePomodoro({now: clock.now}));
    act(() => result.current.start());
    clock.advance(60_000);
    act(() => result.current.pause());
    expect(result.current.runtime.status).toBe(STATUS.PAUSED);
    expect(result.current.runtime.startedAt).toBeNull();
    expect(result.current.runtime.accumulatedMs).toBe(60_000);
  });

  it('resume after pause keeps accumulated time', () => {
    const clock = makeNow();
    const {result} = renderHook(() => usePomodoro({now: clock.now}));
    act(() => result.current.start());
    clock.advance(60_000);
    act(() => result.current.pause());
    clock.advance(10_000);
    act(() => result.current.start());
    expect(result.current.runtime.accumulatedMs).toBe(60_000);
    expect(result.current.runtime.status).toBe(STATUS.RUNNING);
  });

  it('start while running is a no-op', () => {
    const clock = makeNow();
    const {result} = renderHook(() => usePomodoro({now: clock.now}));
    act(() => result.current.start());
    const firstStartedAt = result.current.runtime.startedAt;
    clock.advance(5_000);
    act(() => result.current.start());
    expect(result.current.runtime.startedAt).toBe(firstStartedAt);
  });
});

describe('usePomodoro — skip', () => {
  it('advances work → shortBreak (default cadence) without history bump', () => {
    const todayIso = () => '2026-05-04';
    const clock = makeNow();
    const {result} = renderHook(() =>
      usePomodoro({now: clock.now, todayIso})
    );
    act(() => result.current.start());
    act(() => result.current.skip());
    expect(result.current.runtime.phase).toBe(PHASE.SHORT_BREAK);
    expect(result.current.runtime.status).toBe(STATUS.PAUSED);
    expect(result.current.runtime.completedWorkSessions).toBe(0);
    expect(result.current.history['2026-05-04']).toBeUndefined();
  });

  it('advances shortBreak → work', () => {
    const clock = makeNow();
    const {result} = renderHook(() => usePomodoro({now: clock.now}));
    act(() => result.current.skip()); // work → short
    act(() => result.current.skip()); // short → work
    expect(result.current.runtime.phase).toBe(PHASE.WORK);
  });
});

describe('usePomodoro — completePhase', () => {
  it('work completion increments history for today and bumps work counter', () => {
    const todayIso = () => '2026-05-04';
    const clock = makeNow();
    const {result} = renderHook(() =>
      usePomodoro({now: clock.now, todayIso})
    );
    act(() => result.current.start());
    let returned;
    act(() => {
      returned = result.current.completePhase();
    });
    expect(returned).toBe(PHASE.WORK);
    expect(result.current.runtime.phase).toBe(PHASE.SHORT_BREAK);
    expect(result.current.runtime.status).toBe(STATUS.PAUSED);
    expect(result.current.runtime.completedWorkSessions).toBe(1);
    expect(result.current.history['2026-05-04'].completedPomodoros).toBe(1);
  });

  it('break completion does NOT increment history nor work counter', () => {
    const todayIso = () => '2026-05-04';
    const clock = makeNow();
    const {result} = renderHook(() =>
      usePomodoro({now: clock.now, todayIso})
    );
    act(() => result.current.skip()); // → short break, paused
    act(() => {
      result.current.completePhase();
    });
    expect(result.current.runtime.phase).toBe(PHASE.WORK);
    expect(result.current.runtime.completedWorkSessions).toBe(0);
    expect(result.current.history['2026-05-04']).toBeUndefined();
  });

  it('long-break cadence: every 4th completion lands on longBreak', () => {
    const clock = makeNow();
    const {result} = renderHook(() =>
      usePomodoro({now: clock.now, todayIso: () => '2026-05-04'})
    );

    function completeWork() {
      act(() => result.current.start());
      act(() => result.current.completePhase()); // work → break (paused)
    }
    function completeBreak() {
      act(() => result.current.start());
      act(() => result.current.completePhase()); // break → work (paused)
    }

    // Pomodoros 1, 2, 3 → short break
    completeWork();
    expect(result.current.runtime.phase).toBe(PHASE.SHORT_BREAK);
    completeBreak();
    completeWork();
    expect(result.current.runtime.phase).toBe(PHASE.SHORT_BREAK);
    completeBreak();
    completeWork();
    expect(result.current.runtime.phase).toBe(PHASE.SHORT_BREAK);
    completeBreak();
    // Pomodoro 4 → LONG break.
    completeWork();
    expect(result.current.runtime.phase).toBe(PHASE.LONG_BREAK);
    expect(result.current.runtime.completedWorkSessions).toBe(4);
    expect(result.current.history['2026-05-04'].completedPomodoros).toBe(4);
  });

  it('midnight rollover: completion on a new ISO date creates a new history key', () => {
    let day = '2026-05-04';
    const clock = makeNow();
    const {result} = renderHook(() =>
      usePomodoro({now: clock.now, todayIso: () => day})
    );
    act(() => result.current.start());
    act(() => result.current.completePhase());
    expect(result.current.history['2026-05-04'].completedPomodoros).toBe(1);
    // Next break completes (back to work).
    act(() => result.current.start());
    act(() => result.current.completePhase());

    // Crossing local midnight.
    day = '2026-05-05';
    act(() => result.current.start());
    act(() => result.current.completePhase());
    expect(result.current.history['2026-05-04'].completedPomodoros).toBe(1);
    expect(result.current.history['2026-05-05'].completedPomodoros).toBe(1);
  });
});

describe('usePomodoro — reset', () => {
  it('reset wipes runtime to defaults but preserves settings and history', () => {
    const clock = makeNow();
    const {result} = renderHook(() =>
      usePomodoro({now: clock.now, todayIso: () => '2026-05-04'})
    );
    act(() => result.current.updateSettings({workMinutes: 30}));
    act(() => result.current.start());
    act(() => result.current.completePhase()); // history += 1, phase = shortBreak

    act(() => result.current.reset());
    expect(result.current.runtime.phase).toBe(PHASE.WORK);
    expect(result.current.runtime.status).toBe(STATUS.IDLE);
    expect(result.current.runtime.accumulatedMs).toBe(0);
    expect(result.current.runtime.completedWorkSessions).toBe(0);
    expect(result.current.runtime.startedAt).toBeNull();
    // Preserved.
    expect(result.current.settings.workMinutes).toBe(30);
    expect(result.current.history['2026-05-04'].completedPomodoros).toBe(1);
  });
});

describe('usePomodoro — restore', () => {
  it('restore loads settings + runtime + history from a snapshot', () => {
    const {result} = renderHook(() => usePomodoro());
    act(() => {
      result.current.restore({
        settings: {...DEFAULT_SETTINGS, workMinutes: 50},
        runtime: {
          phase: PHASE.SHORT_BREAK,
          status: STATUS.PAUSED,
          startedAt: null,
          accumulatedMs: 90_000,
          completedWorkSessions: 2,
        },
        history: {'2026-05-04': {completedPomodoros: 5}},
      });
    });
    expect(result.current.settings.workMinutes).toBe(50);
    expect(result.current.runtime.phase).toBe(PHASE.SHORT_BREAK);
    expect(result.current.runtime.completedWorkSessions).toBe(2);
    expect(result.current.history['2026-05-04'].completedPomodoros).toBe(5);
  });
});

describe('usePomodoro — remainingAt / currentPhaseDurationMs', () => {
  it('reports full duration when idle, decreases while running', () => {
    const clock = makeNow();
    const {result} = renderHook(() => usePomodoro({now: clock.now}));
    expect(result.current.currentPhaseDurationMs).toBe(25 * 60_000);
    expect(result.current.remainingAt(clock.now())).toBe(25 * 60_000);
    act(() => result.current.start());
    clock.advance(60_000);
    expect(result.current.remainingAt(clock.now())).toBe(24 * 60_000);
  });
});
