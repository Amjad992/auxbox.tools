import {useEffect, useRef} from 'react';

/**
 * requestAnimationFrame loop that fires `callback(now)` on every animation
 * frame while `active` is true. Cancels on unmount or when `active` flips
 * back to false.
 *
 * The hook is intentionally state-free: consumers decide whether to trigger
 * a re-render (e.g. `setTick(t => t + 1)`) inside the callback. Storing
 * `now` in state per frame is wasteful — read it from `Date.now()` (or the
 * `now` argument here) at render time instead.
 *
 * @param {(now: number) => void} callback - Invoked on every frame while
 *   `active` is true. Receives `performance.now()` for the current frame.
 * @param {{active: boolean}} options
 */
export function useTicker(callback, {active}) {
  const callbackRef = useRef(callback);

  // Always read the latest callback inside the rAF loop without retriggering
  // the effect each render.
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!active) return undefined;
    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
      return undefined;
    }

    let frameId = 0;
    let cancelled = false;

    const tick = (now) => {
      if (cancelled) return;
      callbackRef.current(now);
      if (cancelled) return;
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (frameId && typeof window.cancelAnimationFrame === 'function') {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [active]);
}
