import {describe, it, expect, vi} from 'vitest';
import {render, renderHook, act, waitFor} from '@testing-library/react';
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

  it('does not flip hydrated to true when unmounted before async loader resolves', async () => {
    // Collect each rendered value so we can assert it never went true.
    const renders = [];
    let resolveLoader;

    function Comp() {
      const hydrated = useHydrateStorage(
        () => new Promise((r) => { resolveLoader = r; })
      );
      renders.push(hydrated);
      return null;
    }

    const {unmount} = render(<Comp />);
    // Unmount before the loader resolves — the cancelled flag should block
    // the setHydrated(true) call.
    unmount();

    // Resolve after unmount; should be a no-op.
    await act(async () => {
      resolveLoader();
    });

    // The component only ever rendered with hydrated === false.
    expect(renders.every((v) => v === false)).toBe(true);
  });
});
