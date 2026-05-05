import {useCallback, useState} from 'react';
import {useTicker} from './useTicker';

/**
 * rAF-driven re-render trigger. Returns nothing — just flips an internal
 * counter every animation frame while `active` is true so the caller's
 * render reads the latest wall-clock value.
 *
 * Pair with a wall-clock read at render time (e.g.
 * `DateTime.now().toMillis()`); the hook does NOT store the time itself.
 *
 * Used by Stopwatch and Pomodoro Timer to refresh their displays.
 *
 * @param {boolean} active
 */
export function useDisplayTick(active) {
  const [, setTick] = useState(0);
  const onFrame = useCallback(() => {
    setTick((n) => (n + 1) % 1_000_000);
  }, []);
  useTicker(onFrame, {active});
}
