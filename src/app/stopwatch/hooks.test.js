import {describe, it, expect} from 'vitest';
import {act, renderHook} from '@testing-library/react';
import {useStopwatch} from './hooks';
import {STATUS} from './constants';

describe('useStopwatch', () => {
  it('starts in idle with zero state', () => {
    const {result} = renderHook(() => useStopwatch());
    expect(result.current.status).toBe(STATUS.IDLE);
    expect(result.current.startedAt).toBeNull();
    expect(result.current.accumulatedMs).toBe(0);
    expect(result.current.laps).toEqual([]);
  });

  it('start transitions idle → running and records startedAt', () => {
    let t = 1_000_000;
    const {result} = renderHook(() => useStopwatch({now: () => t}));
    act(() => result.current.start());
    expect(result.current.status).toBe(STATUS.RUNNING);
    expect(result.current.startedAt).toBe(1_000_000);
  });

  it('stop transitions running → paused and accumulates elapsed', () => {
    let t = 1_000_000;
    const {result} = renderHook(() => useStopwatch({now: () => t}));
    act(() => result.current.start());
    t = 1_005_500; // +5.5 s
    act(() => result.current.stop());
    expect(result.current.status).toBe(STATUS.PAUSED);
    expect(result.current.startedAt).toBeNull();
    expect(result.current.accumulatedMs).toBe(5_500);
  });

  it('start from paused resumes without losing accumulated time', () => {
    let t = 1_000_000;
    const {result} = renderHook(() => useStopwatch({now: () => t}));
    act(() => result.current.start());
    t = 1_002_000;
    act(() => result.current.stop()); // accumulated = 2000
    t = 1_010_000;
    act(() => result.current.start()); // resume
    expect(result.current.status).toBe(STATUS.RUNNING);
    expect(result.current.accumulatedMs).toBe(2_000);
    expect(result.current.startedAt).toBe(1_010_000);
  });

  it('lap appends a row with correct delta and total', () => {
    let t = 1_000_000;
    const {result} = renderHook(() => useStopwatch({now: () => t}));
    act(() => result.current.start());
    t = 1_003_000;
    act(() => result.current.lap()); // total 3000, delta 3000
    t = 1_007_500;
    act(() => result.current.lap()); // total 7500, delta 4500

    expect(result.current.laps).toEqual([
      {index: 1, totalElapsedMs: 3_000, deltaMs: 3_000},
      {index: 2, totalElapsedMs: 7_500, deltaMs: 4_500},
    ]);
  });

  it('lap is a no-op when not running', () => {
    const {result} = renderHook(() => useStopwatch({now: () => 1}));
    act(() => result.current.lap());
    expect(result.current.laps).toEqual([]);
  });

  it('reset clears back to idle', () => {
    let t = 1_000_000;
    const {result} = renderHook(() => useStopwatch({now: () => t}));
    act(() => result.current.start());
    t = 1_005_000;
    act(() => result.current.lap());
    act(() => result.current.stop());

    act(() => result.current.reset());
    expect(result.current.status).toBe(STATUS.IDLE);
    expect(result.current.startedAt).toBeNull();
    expect(result.current.accumulatedMs).toBe(0);
    expect(result.current.laps).toEqual([]);
  });

  it('restore from running snapshot keeps startedAt so live elapsed advances', () => {
    const fiveSecondsAgo = 1_000_000;
    let t = 1_005_000; // 5 s after the persisted startedAt
    const {result} = renderHook(() => useStopwatch({now: () => t}));
    act(() =>
      result.current.restore({
        status: STATUS.RUNNING,
        startedAt: fiveSecondsAgo,
        accumulatedMs: 0,
        laps: [],
      })
    );
    expect(result.current.status).toBe(STATUS.RUNNING);
    expect(result.current.startedAt).toBe(fiveSecondsAgo);
  });
});
