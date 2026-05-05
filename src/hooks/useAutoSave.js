import {useCallback, useEffect, useRef} from 'react';

/**
 * Debounced "auto-save when dirty" effect. Captures the canonical pattern
 * used by every tool that persists state: hold off saving until the user
 * has actually taken an action (so a fresh-mount no-interaction visit does
 * not write defaults), then save on any subsequent change after a debounce.
 *
 * Returns `{markDirty, markClean}` — call `markDirty()` from every action
 * handler that should trigger a save, and `markClean()` from Clear/Reset
 * handlers that wipe storage synchronously (so the post-action effect tick
 * does NOT write a phantom record afterwards).
 *
 * @param {object} options
 * @param {() => void} options.onSave - Called when a save should fire.
 *   Called inside a setTimeout so it should be a stable callback, but the
 *   ref-latching here means it does NOT need to be memoised by the caller.
 * @param {boolean} options.enabled - Master gate. Typically `hydrated &&
 *   !overCap`. While false, the effect is a no-op.
 * @param {Array<unknown>} options.deps - Dependency array; whenever any of
 *   these change, the debounce timer is reset and (if dirty + enabled) a
 *   new save is scheduled.
 * @param {number} [options.debounceMs=300] - Debounce delay.
 */
export function useAutoSave({onSave, enabled, deps, debounceMs = 300}) {
  const dirtyRef = useRef(false);
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    if (!enabled || !dirtyRef.current) return undefined;
    const handle = setTimeout(() => {
      onSaveRef.current();
    }, debounceMs);
    return () => clearTimeout(handle);
    // The caller's `deps` array is the source of truth for what to watch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, debounceMs, ...deps]);

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
  }, []);

  const markClean = useCallback(() => {
    dirtyRef.current = false;
  }, []);

  return {markDirty, markClean};
}
