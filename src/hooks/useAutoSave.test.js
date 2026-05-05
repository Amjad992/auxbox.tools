import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {renderHook, act} from '@testing-library/react';
import {useAutoSave} from './useAutoSave';

describe('useAutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not save before markDirty is called', () => {
    const onSave = vi.fn();
    renderHook(() => useAutoSave({onSave, enabled: true, deps: ['a']}));
    act(() => vi.advanceTimersByTime(1000));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('does not save while disabled even after markDirty', () => {
    const onSave = vi.fn();
    const {result} = renderHook(({deps}) =>
      useAutoSave({onSave, enabled: false, deps})
    , {initialProps: {deps: ['a']}});
    act(() => result.current.markDirty());
    act(() => vi.advanceTimersByTime(1000));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('saves after debounce when dirty + enabled and a dep changes', () => {
    const onSave = vi.fn();
    const {result, rerender} = renderHook(({deps}) =>
      useAutoSave({onSave, enabled: true, deps, debounceMs: 300})
    , {initialProps: {deps: ['a']}});
    act(() => result.current.markDirty());
    rerender({deps: ['b']});
    act(() => vi.advanceTimersByTime(299));
    expect(onSave).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('debounces rapid changes — only the last fires', () => {
    const onSave = vi.fn();
    const {result, rerender} = renderHook(({deps}) =>
      useAutoSave({onSave, enabled: true, deps, debounceMs: 300})
    , {initialProps: {deps: ['a']}});
    act(() => result.current.markDirty());
    rerender({deps: ['b']});
    act(() => vi.advanceTimersByTime(100));
    rerender({deps: ['c']});
    act(() => vi.advanceTimersByTime(100));
    rerender({deps: ['d']});
    act(() => vi.advanceTimersByTime(300));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('markClean cancels future saves until markDirty is called again', () => {
    const onSave = vi.fn();
    const {result, rerender} = renderHook(({deps}) =>
      useAutoSave({onSave, enabled: true, deps})
    , {initialProps: {deps: ['a']}});
    act(() => result.current.markDirty());
    rerender({deps: ['b']});
    // Don't advance — flip clean before debounce expires.
    act(() => result.current.markClean());
    rerender({deps: ['c']});
    act(() => vi.advanceTimersByTime(1000));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('uses the latest onSave when it changes', () => {
    const a = vi.fn();
    const b = vi.fn();
    const {result, rerender} = renderHook(({onSave, deps}) =>
      useAutoSave({onSave, enabled: true, deps})
    , {initialProps: {onSave: a, deps: ['x']}});
    act(() => result.current.markDirty());
    rerender({onSave: b, deps: ['y']});
    act(() => vi.advanceTimersByTime(300));
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledTimes(1);
  });
});
