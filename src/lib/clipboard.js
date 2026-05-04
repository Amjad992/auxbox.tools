/**
 * Shared clipboard helper. Environment-only — no React state.
 *
 * Prefer the modern Clipboard API (`navigator.clipboard.writeText`) and fall
 * back to the legacy `document.execCommand('copy')` for older browsers and
 * non-secure contexts where the Clipboard API is unavailable.
 *
 * @param {string} text - Text to copy.
 * @returns {Promise<boolean>} `true` if the copy succeeded, `false` otherwise.
 */
export async function copyToClipboard(text) {
  if (!text) return false;
  try {
    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    ) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    // Fall through to legacy fallback.
  }
  // Legacy fallback for older browsers / non-secure contexts.
  if (typeof document === 'undefined') return false;
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'absolute';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand && document.execCommand('copy');
    document.body.removeChild(ta);
    return !!ok;
  } catch (e) {
    return false;
  }
}
