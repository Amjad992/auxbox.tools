import {
  MAX_FILE_BYTES,
  MAX_FILES,
  MERGED_FILENAME,
  PDF_MIME,
  ERR_TOO_LARGE,
  ERR_TOO_MANY,
  ERR_NOT_PDF,
} from './constants';

/**
 * Pure array reorder: move the item at `fromIndex` to `toIndex`.
 *
 * Returns a new array; never mutates the input. Out-of-bounds indices and
 * no-op moves (from === to) return a shallow copy of the input array so
 * callers can rely on referential change <=> structural change.
 */
export function reorder(list, fromIndex, toIndex) {
  if (!Array.isArray(list)) return [];
  const n = list.length;
  if (
    !Number.isInteger(fromIndex) ||
    !Number.isInteger(toIndex) ||
    fromIndex < 0 ||
    fromIndex >= n ||
    toIndex < 0 ||
    toIndex >= n ||
    fromIndex === toIndex
  ) {
    return list.slice();
  }
  const next = list.slice();
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

/**
 * Parse a user-facing page-range string against a known page count.
 *
 * Conventions:
 *  - 1-based for the user.
 *  - 0-based indices internally (for pdf-lib's copyPages).
 *  - `"1-3,5,7-9"` → ranges + singletons, comma-separated.
 *  - Empty / whitespace input → all pages [0..pageCount-1].
 *  - Whitespace within / around tokens is tolerated.
 *  - Invalid syntax or out-of-range page returns `{error: '...'}`.
 *  - Duplicate / overlapping ranges are preserved in output order so the
 *    user can intentionally repeat a page if they want to.
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
          error: `Range "${part}" exceeds the document's ${pageCount} page${pageCount === 1 ? '' : 's'}.`,
        };
      }
      // Allow descending ranges? Keep it simple: require a <= b.
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
          error: `Page ${n} exceeds the document's ${pageCount} page${pageCount === 1 ? '' : 's'}.`,
        };
      }
      indices.push(n - 1);
    }
  }
  return {indices};
}

/**
 * Validate a batch of incoming files against per-file size, MIME, and the
 * total count cap given the current list. Returns accepted Files plus a
 * list of `{file, reason}` rejections so the UI can show inline errors
 * for each rejected file (instead of silently dropping them).
 *
 * Note: MIME detection here is naive — we trust `file.type` plus a `.pdf`
 * extension fallback. PDFs that fail at parse-time are surfaced separately
 * by the parse step (encrypted / corrupt errors).
 */
export function validateAdditions(currentFiles, newFiles) {
  const accepted = [];
  const rejected = [];
  const remainingSlots = Math.max(0, MAX_FILES - currentFiles.length);

  let acceptedCount = 0;
  for (const file of newFiles) {
    // Run per-file validators first so the user gets the accurate rejection
    // reason (not PDF, too large) even when the slot cap would also apply.
    if (!isPdfFile(file)) {
      rejected.push({file, reason: ERR_NOT_PDF});
      continue;
    }
    if (file.size > MAX_FILE_BYTES) {
      rejected.push({file, reason: ERR_TOO_LARGE});
      continue;
    }
    // Only apply the slot cap to files that would otherwise be accepted.
    if (acceptedCount >= remainingSlots) {
      rejected.push({file, reason: ERR_TOO_MANY});
      continue;
    }
    accepted.push(file);
    acceptedCount += 1;
  }

  return {accepted, rejected};
}

/**
 * Return a download filename for the merged PDF. v1 ships a single,
 * predictable filename — a future polish could let the user name it.
 */
export function mergedFilename() {
  return MERGED_FILENAME;
}

function isPdfFile(file) {
  if (!file) return false;
  if (file.type === PDF_MIME) return true;
  // Some browsers leave file.type empty for files dropped from a file
  // manager; fall back to the extension.
  if (!file.type) {
    const name = (file.name || '').toLowerCase();
    return name.endsWith('.pdf');
  }
  return false;
}
