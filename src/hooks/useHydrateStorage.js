import {useEffect, useRef, useState} from 'react';

/**
 * Mount-once hydration loader. Runs `loader` exactly once on mount and
 * flips a `hydrated` flag once it returns. Tools then gate auto-save / UI
 * on `hydrated` to avoid the phantom-write race documented in the
 * markdown-preview MAJ-2 fix.
 *
 * `loader` may be a sync function or return a Promise. The hook never
 * unmounts the loader's effect; if you need teardown, do it in the loader
 * via local closures (rare).
 *
 * Example:
 *   const hydrated = useHydrateStorage(() => {
 *     const saved = loadState();
 *     if (saved) restore(saved);
 *   });
 *
 * @param {() => void | Promise<void>} loader - Runs once on mount.
 * @returns {boolean} `hydrated` — true after the loader has been called.
 */
export function useHydrateStorage(loader) {
  const [hydrated, setHydrated] = useState(false);
  const loaderRef = useRef(loader);

  useEffect(() => {
    loaderRef.current = loader;
  }, [loader]);

  useEffect(() => {
    let cancelled = false;
    const result = loaderRef.current?.();
    if (result && typeof result.then === 'function') {
      result.finally(() => {
        if (!cancelled) setHydrated(true);
      });
    } else {
      setHydrated(true);
    }
    return () => {
      cancelled = true;
    };
  }, []);

  return hydrated;
}
