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

// Page-range parser lifted to src/lib/pageRange.js so pdf-splitter can
// share it. Re-exported here to keep existing imports working.
export {parsePageRange} from '../../lib/pageRange';

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
