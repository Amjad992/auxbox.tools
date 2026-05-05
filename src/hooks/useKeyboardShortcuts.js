import {useEffect, useRef} from 'react';

const FORM_SELECTOR =
  'input, textarea, select, [contenteditable]:not([contenteditable="false"])';

function isFormFieldTarget(el) {
  if (!el || typeof el.matches !== 'function') return false;
  return el.matches(FORM_SELECTOR);
}

function matchesKey(event, key) {
  if (!key) return false;
  if (key === 'Space' || key === ' ') {
    return event.code === 'Space' || event.key === ' ';
  }
  return event.key?.toLowerCase() === key.toLowerCase();
}

/**
 * Register keyboard shortcuts on `window`. Each shortcut is an object:
 *
 *   {key, handler, when?, preventDefault?}
 *
 * - `key`        Either a single character (case-insensitive) or `'Space'`.
 * - `handler`    Called with the KeyboardEvent when the shortcut fires.
 * - `when`       Optional predicate; if provided and returns false, the
 *                shortcut is skipped (handler not called).
 * - `preventDefault` Defaults to true. Call `event.preventDefault()` before
 *                the handler runs.
 *
 * Default behavior:
 * - Modifier keys (Meta/Ctrl/Alt) are ignored — shortcuts only fire on
 *   bare keypresses to avoid stomping on browser/OS shortcuts.
 * - Keypresses with a focused form field target (input/textarea/select/
 *   contenteditable) are ignored, so the user can type freely.
 *
 * Both gates can be disabled via the second `options` arg.
 *
 * The `shortcuts` array is read through a ref so callers don't need to
 * memoise it — a fresh array on every render is fine.
 *
 * @param {Array<{key:string, handler:(e:KeyboardEvent)=>void, when?:()=>boolean, preventDefault?:boolean}>} shortcuts
 * @param {{ignoreModifiers?:boolean, ignoreFormFields?:boolean, enabled?:boolean}} [options]
 */
export function useKeyboardShortcuts(shortcuts, options = {}) {
  const {
    ignoreModifiers = true,
    ignoreFormFields = true,
    enabled = true,
  } = options;

  const shortcutsRef = useRef(shortcuts);
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    if (!enabled) return undefined;
    if (typeof window === 'undefined') return undefined;

    function onKeyDown(e) {
      if (ignoreModifiers && (e.metaKey || e.ctrlKey || e.altKey)) return;
      if (ignoreFormFields && isFormFieldTarget(e.target)) return;
      const list = shortcutsRef.current || [];
      for (const s of list) {
        if (!matchesKey(e, s.key)) continue;
        if (typeof s.when === 'function' && !s.when()) continue;
        if (s.preventDefault !== false) e.preventDefault();
        s.handler(e);
        return;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, ignoreModifiers, ignoreFormFields]);
}
