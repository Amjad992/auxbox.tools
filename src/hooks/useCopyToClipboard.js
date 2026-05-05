import {useCallback, useEffect, useRef} from 'react';
import {copyToClipboard} from '../lib/clipboard';

/**
 * Copy-to-clipboard helper with optional toast feedback and dedup.
 *
 * If `showToast` is provided, the hook will display a success or error
 * toast on every copy attempt. If `dismissToast` is also provided, the
 * hook tracks the most recent success-toast id and dismisses it the next
 * time `copy()` runs — preventing the "stale ‘Password copied’ banner is
 * still visible after you generated a new password" UX bug.
 *
 * Concurrent calls are not designed to be interleaved safely: whichever
 * clipboard operation resolves first will set `lastSuccessIdRef`, and the
 * second resolution will dismiss that id before showing its own success
 * toast. For the typical single-button copy flow this is the correct
 * behaviour; avoid parallel `copy()` calls from independent triggers.
 *
 * @param {object} [options]
 * @param {(msg:string, type?:string) => number} [options.showToast]
 * @param {(id:number) => void} [options.dismissToast]
 * @param {string} [options.successMessage='Copied to clipboard']
 * @param {string} [options.errorMessage='Could not copy to clipboard']
 * @returns {(text:string, overrides?:{successMessage?:string,errorMessage?:string}) => Promise<boolean>}
 */
export function useCopyToClipboard(options = {}) {
  const {
    showToast,
    dismissToast,
    successMessage = 'Copied to clipboard',
    errorMessage = 'Could not copy to clipboard',
  } = options;

  const optsRef = useRef({showToast, dismissToast, successMessage, errorMessage});
  useEffect(() => {
    optsRef.current = {showToast, dismissToast, successMessage, errorMessage};
  });

  const lastSuccessIdRef = useRef(null);

  const copy = useCallback(async (text, overrides = {}) => {
    const {showToast: st, dismissToast: dt, successMessage: sm, errorMessage: em} =
      optsRef.current;
    const ok = await copyToClipboard(text);
    const successMsg = overrides.successMessage ?? sm;
    const errorMsg = overrides.errorMessage ?? em;

    if (st) {
      if (dt && lastSuccessIdRef.current !== null) {
        dt(lastSuccessIdRef.current);
        lastSuccessIdRef.current = null;
      }
      const id = st(ok ? successMsg : errorMsg, ok ? 'success' : 'error');
      if (ok && typeof id === 'number') {
        lastSuccessIdRef.current = id;
      }
    }
    return ok;
  }, []);

  return copy;
}
