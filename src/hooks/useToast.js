import {useState, useCallback, useEffect} from 'react';

/**
 * Custom hook for managing toast notifications
 * @param {number} duration - How long to show toast in milliseconds
 * @returns {Object} - Toast state and show function
 */
export function useToast(duration = 5000) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback(
    (message, type = 'error') => {
      const id = Date.now();
      setToasts((prev) => [...prev, {id, message, type}]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, duration);
    },
    [duration]
  );

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return {toasts, showToast, dismissToast};
}
