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
    // jsdom does not define document.execCommand. Define it so we can spy on
    // it and restore it cleanly, avoiding test-pollution from a bare assignment.
    if (!('execCommand' in document)) {
      Object.defineProperty(document, 'execCommand', {
        configurable: true,
        writable: true,
        value: () => false,
      });
    }
    const execSpy = vi.spyOn(document, 'execCommand').mockReturnValue(false);
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
    execSpy.mockRestore();
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

  it('concurrent copy() calls: the second dismisses the first success id then shows its own', async () => {
    // Control resolution order: A resolves first, then B.
    let resolveA;
    let resolveB;
    writeTextSpy
      .mockImplementationOnce(() => new Promise((r) => { resolveA = r; }))
      .mockImplementationOnce(() => new Promise((r) => { resolveB = r; }));

    let nextId = 200;
    const showToast = vi.fn(() => ++nextId);
    const dismissToast = vi.fn();

    const {result} = renderHook(() =>
      useCopyToClipboard({showToast, dismissToast})
    );

    // Fire both concurrently; neither has resolved yet.
    let copyAPromise;
    let copyBPromise;
    await act(async () => {
      copyAPromise = result.current('a');
      copyBPromise = result.current('b');
    });

    // A resolves first → showToast(success) → id 201 stored in lastSuccessIdRef.
    await act(async () => { resolveA(); });
    await act(async () => { await copyAPromise; });
    expect(showToast).toHaveBeenCalledTimes(1);
    expect(dismissToast).not.toHaveBeenCalled();

    // B resolves second → dismisses A's toast (201), shows its own (202).
    await act(async () => { resolveB(); });
    await act(async () => { await copyBPromise; });
    expect(dismissToast).toHaveBeenCalledWith(201);
    expect(showToast).toHaveBeenCalledTimes(2);
  });
});
