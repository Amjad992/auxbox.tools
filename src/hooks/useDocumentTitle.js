import {useEffect, useRef} from 'react';

/**
 * Set `document.title` while the component is mounted. Restores the previous
 * title on unmount or when `title` becomes null.
 *
 * The previous title is captured once on mount; it is NOT re-captured when
 * `title` changes. This keeps stacked instances well-behaved.
 *
 * @param {string | null} title - When a non-empty string, document.title is
 *   set to it. When `null`, the original title is restored. Empty string is
 *   treated like null (no override).
 */
export function useDocumentTitle(title) {
  const previousTitleRef = useRef(null);

  // Capture the original title exactly once on mount.
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    previousTitleRef.current = document.title;
    return () => {
      if (previousTitleRef.current !== null) {
        document.title = previousTitleRef.current;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (typeof title === 'string' && title.length > 0) {
      document.title = title;
    } else if (previousTitleRef.current !== null) {
      // title is null/empty — restore the captured original.
      document.title = previousTitleRef.current;
    }
  }, [title]);
}
