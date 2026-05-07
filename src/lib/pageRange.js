/**
 * Parse a user-facing page-range string against a known page count.
 *
 * Conventions:
 *  - 1-based for the user.
 *  - 0-based indices internally (matches pdf-lib's copyPages API).
 *  - `"1-3,5,7-9"` → ranges + singletons, comma-separated.
 *  - Empty / whitespace input → all pages [0..pageCount-1].
 *  - Whitespace within / around tokens is tolerated.
 *  - Invalid syntax or out-of-range page returns `{error: '...'}`.
 *  - Duplicate / overlapping ranges are preserved in output order so the
 *    user can intentionally repeat a page if they want to.
 *
 * Used by pdf-merger (per-file ranges before merge) and pdf-splitter
 * (whole-document range before extraction).
 *
 * @param {string} input
 * @param {number} pageCount  total pages in the source PDF (>=1)
 * @returns {{indices: number[]} | {error: string}}
 */
export function parsePageRange(input, pageCount) {
  if (!Number.isInteger(pageCount) || pageCount < 1) {
    return {error: 'Page count is unknown.'};
  }

  const trimmed = (input ?? '').trim();
  if (trimmed === '') {
    const indices = [];
    for (let i = 0; i < pageCount; i++) indices.push(i);
    return {indices};
  }

  const parts = trimmed.split(',');
  const indices = [];
  for (const rawPart of parts) {
    const part = rawPart.trim();
    if (part === '') {
      return {error: `Empty range segment in "${trimmed}".`};
    }

    if (part.includes('-')) {
      const sides = part.split('-');
      if (sides.length !== 2) {
        return {error: `Invalid range "${part}".`};
      }
      const aRaw = sides[0].trim();
      const bRaw = sides[1].trim();
      if (aRaw === '' || bRaw === '') {
        return {error: `Invalid range "${part}".`};
      }
      if (!/^\d+$/.test(aRaw) || !/^\d+$/.test(bRaw)) {
        return {error: `Invalid range "${part}".`};
      }
      const a = Number(aRaw);
      const b = Number(bRaw);
      if (!Number.isInteger(a) || !Number.isInteger(b) || a < 1 || b < 1) {
        return {error: `Invalid range "${part}".`};
      }
      if (a > pageCount || b > pageCount) {
        return {
          error: `Range "${part}" exceeds the document's ${pageCount} page${
            pageCount === 1 ? '' : 's'
          }.`,
        };
      }
      if (a > b) {
        return {error: `Range "${part}" is reversed; use lower-higher.`};
      }
      for (let i = a; i <= b; i++) indices.push(i - 1);
    } else {
      if (!/^\d+$/.test(part)) {
        return {error: `Invalid page "${part}".`};
      }
      const n = Number(part);
      if (!Number.isInteger(n) || n < 1) {
        return {error: `Invalid page "${part}".`};
      }
      if (n > pageCount) {
        return {
          error: `Page ${n} exceeds the document's ${pageCount} page${
            pageCount === 1 ? '' : 's'
          }.`,
        };
      }
      indices.push(n - 1);
    }
  }
  return {indices};
}

