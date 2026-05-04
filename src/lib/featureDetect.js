/**
 * Browser feature detection constants — evaluated once at module load.
 *
 * Keeping the checks here rather than inline in effects means:
 *   1. The check pays its cost once per page load, not once per keystroke.
 *   2. Tests can stub the export via vi.mock without re-importing the module.
 */

/**
 * True when the browser natively sizes a textarea via CSS `field-sizing: content`
 * (Chromium 123+, Safari 17+). When true, the JS scrollHeight autosize fallback
 * in the markdown editor pages is skipped — letting the CSS path win avoids a
 * race that would re-introduce a scrollbar.
 */
export const HAS_FIELD_SIZING =
  typeof CSS !== 'undefined' &&
  typeof CSS.supports === 'function' &&
  CSS.supports('field-sizing', 'content');
