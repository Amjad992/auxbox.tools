import {useCallback, useEffect, useState} from 'react';

/**
 * Wrap the Web Notifications API permission state.
 *
 * Returns `{permission, request, supported}`:
 *   - `supported` — true when the Notification API is available in this
 *     runtime (i.e. `'Notification' in window`).
 *   - `permission` — `'default' | 'granted' | 'denied'`. Mirrors
 *     `Notification.permission`. Falls back to `'denied'` when the API is not
 *     supported.
 *   - `request` — async function that calls `Notification.requestPermission()`
 *     and updates the local permission state. No-op (resolves with the
 *     current `permission`) when the API isn't supported.
 *
 * The hook never auto-prompts the user — the consumer is expected to call
 * `request()` from an explicit user action (e.g. a button click).
 */
export function useNotificationPermission() {
  const supported =
    typeof window !== 'undefined' &&
    typeof globalThis !== 'undefined' &&
    'Notification' in globalThis &&
    typeof globalThis.Notification === 'function';

  const initialPermission = supported
    ? globalThis.Notification.permission || 'default'
    : 'denied';

  const [permission, setPermission] = useState(initialPermission);

  // Re-sync once on mount in case the live `Notification.permission` value
  // has drifted from what useState captured (rare, but cheap).
  useEffect(() => {
    if (!supported) return;
    const live = globalThis.Notification.permission || 'default';
    setPermission((prev) => (prev === live ? prev : live));
  }, [supported]);

  const request = useCallback(async () => {
    if (!supported) return permission;
    try {
      const result = await globalThis.Notification.requestPermission();
      const next = typeof result === 'string' ? result : globalThis.Notification.permission;
      setPermission(next || 'default');
      return next || 'default';
    } catch {
      // Some legacy implementations throw if the user dismisses the prompt.
      const fallback = globalThis.Notification.permission || 'default';
      setPermission(fallback);
      return fallback;
    }
  }, [supported, permission]);

  return {permission, request, supported};
}
