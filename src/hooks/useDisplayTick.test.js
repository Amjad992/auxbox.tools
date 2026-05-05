import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {renderHook} from '@testing-library/react';
import {useDisplayTick} from './useDisplayTick';

describe('useDisplayTick', () => {
  let rafCallbacks;
  let rafSpy;

  beforeEach(() => {
    rafCallbacks = [];
    rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not schedule a frame while inactive', () => {
    renderHook(() => useDisplayTick(false));
    expect(rafSpy).not.toHaveBeenCalled();
  });

  it('schedules frames while active', () => {
    renderHook(() => useDisplayTick(true));
    expect(rafSpy).toHaveBeenCalled();
  });
});
