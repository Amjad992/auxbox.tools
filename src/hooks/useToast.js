import {useState, useCallback, useRef} from 'react';

/**
 * Custom hook for managing toast notifications.
 *
 * `showToast` returns the new toast's id so callers can later dismiss it
 * (e.g. to suppress a stale "copied" banner when the underlying value
 * changes). Pre-existing call sites that ignored the return value continue
 * to work unchanged.
 *
 * @param {number} duration - How long to show toast in milliseconds
 * @returns {Object} Toast state and show/dismiss functions.
 */
export function useToast(duration = 5000) {
  const [toasts, setToasts] = useState([]);
  // Per-instance counter used to disambiguate ids generated within the
  // same millisecond — `Date.now()` alone collides on rapid double-fires.
  const seqRef = useRef(0);

  const showToast = useCallback(
    (message, type = 'error') => {
      seqRef.current = (seqRef.current + 1) & 0xffff;
      const id = Date.now() * 0x10000 + seqRef.current;
      setToasts((prev) => [...prev, {id, message, type}]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, duration);
      return id;
    },
    [duration]
  );

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return {toasts, showToast, dismissToast};
}
