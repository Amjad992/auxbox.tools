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
  // Monotonic per-instance counter. Each call increments and uses the new
  // value as the toast id — unique within a hook instance for the lifetime
  // of the component, with no floating-point precision edge cases.
  const seqRef = useRef(0);

  const showToast = useCallback(
    (message, type = 'error') => {
      const id = ++seqRef.current;
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
