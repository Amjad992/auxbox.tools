import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {renderHook, act} from '@testing-library/react';
import {useTicker} from './useTicker';

describe('useTicker', () => {
  let rafCallbacks;
  let rafId;
  let rafSpy;
  let cafSpy;

  beforeEach(() => {
    rafCallbacks = new Map();
    rafId = 0;
    rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafId += 1;
      rafCallbacks.set(rafId, cb);
      return rafId;
    });
    cafSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      rafCallbacks.delete(id);
    });
  });

  afterEach(() => {
    rafSpy.mockRestore();
    cafSpy.mockRestore();
  });

  // Drive one frame: invoke every pending callback and clear the queue.
  function flushFrame(now = performance.now()) {
    const pending = Array.from(rafCallbacks.entries());
    rafCallbacks.clear();
    act(() => {
      for (const [, cb] of pending) cb(now);
    });
  }

  it('does not schedule a frame when active is false on mount', () => {
    renderHook(() => useTicker(() => {}, {active: false}));
    expect(rafSpy).not.toHaveBeenCalled();
  });

  it('schedules a frame when active is true and fires the callback', () => {
    const cb = vi.fn();
    renderHook(() => useTicker(cb, {active: true}));
    expect(rafSpy).toHaveBeenCalledTimes(1);
    flushFrame(123);
    expect(cb).toHaveBeenCalledWith(123);
    // After firing, the loop should have re-scheduled.
    expect(rafSpy).toHaveBeenCalledTimes(2);
  });

  it('keeps firing on each frame while active', () => {
    const cb = vi.fn();
    renderHook(() => useTicker(cb, {active: true}));
    flushFrame(1);
    flushFrame(2);
    flushFrame(3);
    expect(cb).toHaveBeenCalledTimes(3);
    expect(cb).toHaveBeenNthCalledWith(1, 1);
    expect(cb).toHaveBeenNthCalledWith(2, 2);
    expect(cb).toHaveBeenNthCalledWith(3, 3);
  });

  it('stops firing once active flips to false', () => {
    const cb = vi.fn();
    const {rerender} = renderHook(({a}) => useTicker(cb, {active: a}), {
      initialProps: {a: true},
    });
    flushFrame(10);
    expect(cb).toHaveBeenCalledTimes(1);

    rerender({a: false});
    // After flip, no new pending frames should run.
    flushFrame(20);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('cancels the pending frame on unmount', () => {
    const cb = vi.fn();
    const {unmount} = renderHook(() => useTicker(cb, {active: true}));
    expect(rafSpy).toHaveBeenCalledTimes(1);
    unmount();
    expect(cafSpy).toHaveBeenCalled();
    // Even if a stale frame fires, the cancelled flag suppresses it.
    flushFrame(99);
    expect(cb).not.toHaveBeenCalled();
  });

  it('uses the latest callback without re-subscribing', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const {rerender} = renderHook(({c}) => useTicker(c, {active: true}), {
      initialProps: {c: cb1},
    });
    flushFrame(1);
    expect(cb1).toHaveBeenCalledTimes(1);

    rerender({c: cb2});
    flushFrame(2);
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);
    // active didn't change — no extra subscription churn (initial + after first frame + after second frame = 3)
    expect(rafSpy).toHaveBeenCalledTimes(3);
  });
});
