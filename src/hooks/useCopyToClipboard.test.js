import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {renderHook, act} from '@testing-library/react';
import {useCopyToClipboard} from './useCopyToClipboard';

describe('useCopyToClipboard', () => {
  let writeTextSpy;

  beforeEach(() => {
    writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {writeText: writeTextSpy},
    });
  });

  afterEach(() => {
    delete navigator.clipboard;
  });

  it('returns true and calls clipboard.writeText on success', async () => {
    const {result} = renderHook(() => useCopyToClipboard());
    let ok;
    await act(async () => {
      ok = await result.current('hello');
    });
    expect(ok).toBe(true);
    expect(writeTextSpy).toHaveBeenCalledWith('hello');
  });

  it('shows a success toast when showToast is provided', async () => {
    const showToast = vi.fn(() => 1);
    const {result} = renderHook(() =>
      useCopyToClipboard({showToast, successMessage: 'Yay'})
    );
    await act(async () => {
      await result.current('x');
    });
    expect(showToast).toHaveBeenCalledWith('Yay', 'success');
  });

  it('shows an error toast when copy fails', async () => {
    writeTextSpy.mockRejectedValueOnce(new Error('blocked'));
    // Also make execCommand fail so the legacy fallback returns false.
    document.execCommand = vi.fn().mockReturnValue(false);
    const showToast = vi.fn(() => 2);
    const {result} = renderHook(() =>
      useCopyToClipboard({showToast, errorMessage: 'Nope'})
    );
    let ok;
    await act(async () => {
      ok = await result.current('x');
    });
    expect(ok).toBe(false);
    expect(showToast).toHaveBeenCalledWith('Nope', 'error');
  });

  it('dismisses prior success toast before showing a new one when dismissToast is provided', async () => {
    let nextId = 100;
    const showToast = vi.fn(() => ++nextId);
    const dismissToast = vi.fn();
    const {result} = renderHook(() =>
      useCopyToClipboard({showToast, dismissToast})
    );
    await act(async () => {
      await result.current('a');
    });
    expect(dismissToast).not.toHaveBeenCalled();
    await act(async () => {
      await result.current('b');
    });
    expect(dismissToast).toHaveBeenCalledWith(101);
  });

  it('per-call overrides win over hook-level defaults', async () => {
    const showToast = vi.fn(() => 1);
    const {result} = renderHook(() =>
      useCopyToClipboard({showToast, successMessage: 'Default'})
    );
    await act(async () => {
      await result.current('x', {successMessage: 'Override'});
    });
    expect(showToast).toHaveBeenCalledWith('Override', 'success');
  });
});
