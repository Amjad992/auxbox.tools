import {describe, it, expect, vi} from 'vitest';
import {renderHook, act, waitFor} from '@testing-library/react';
import {useHydrateStorage} from './useHydrateStorage';

describe('useHydrateStorage', () => {
  it('runs the loader once on mount and flips hydrated to true', async () => {
    const loader = vi.fn();
    const {result} = renderHook(() => useHydrateStorage(loader));
    await waitFor(() => expect(result.current).toBe(true));
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('does not re-run loader on rerender', async () => {
    const loader = vi.fn();
    const {result, rerender} = renderHook(() => useHydrateStorage(loader));
    await waitFor(() => expect(result.current).toBe(true));
    rerender();
    rerender();
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('waits for an async loader before flipping hydrated', async () => {
    let resolveLoader;
    const loader = vi.fn(
      () => new Promise((r) => {
        resolveLoader = r;
      })
    );
    const {result} = renderHook(() => useHydrateStorage(loader));
    expect(result.current).toBe(false);
    await act(async () => {
      resolveLoader();
    });
    await waitFor(() => expect(result.current).toBe(true));
  });
});
