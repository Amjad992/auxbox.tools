import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast } from './useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with an empty toasts list', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual([]);
  });

  it('showToast appends a toast with id, message, and default error type', () => {
    const { result } = renderHook(() => useToast());
    act(() => result.current.showToast('boom'));
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      message: 'boom',
      type: 'error',
    });
    expect(typeof result.current.toasts[0].id).toBe('number');
  });

  it('showToast respects an explicit type', () => {
    const { result } = renderHook(() => useToast());
    act(() => result.current.showToast('saved', 'success'));
    expect(result.current.toasts[0].type).toBe('success');
  });

  it('auto-dismisses after the configured duration', () => {
    const { result } = renderHook(() => useToast(1000));
    act(() => result.current.showToast('hi'));
    expect(result.current.toasts).toHaveLength(1);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it('dismissToast removes the matching toast immediately', () => {
    const { result } = renderHook(() => useToast(10000));
    act(() => result.current.showToast('a'));
    // Advance the fake clock so the second toast gets a distinct Date.now()-based id.
    act(() => vi.advanceTimersByTime(1));
    act(() => result.current.showToast('b'));
    const ids = result.current.toasts.map((t) => t.id);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);

    act(() => result.current.dismissToast(ids[0]));
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('b');
  });

  it('multiple toasts shown in sequence each get their own auto-dismiss', () => {
    const { result } = renderHook(() => useToast(500));
    let aId, bId;
    act(() => {
      result.current.showToast('a');
      aId = Date.now();
      vi.advanceTimersByTime(100);
      result.current.showToast('b');
      bId = Date.now();
    });
    // Voucher: only verify the count progression, not Date.now() identity
    expect(result.current.toasts).toHaveLength(2);

    act(() => {
      vi.advanceTimersByTime(450); // a expires (total 550), b not yet (total 450 since b)
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('b');

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.toasts).toHaveLength(0);

    // dummy use to silence unused warnings
    void aId;
    void bId;
  });
});
