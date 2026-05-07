// Regex Tester — pure helpers.

/**
 * Try to compile a regex from `pattern` + `flags`. Returns either
 * `{ok: true, regex}` or `{ok: false, error}` (the JS message verbatim).
 */
export function compileRegex(pattern, flags) {
  if (typeof pattern !== 'string' || pattern === '') {
    return {ok: false, error: 'Pattern is empty.'};
  }
  try {
    const regex = new RegExp(pattern, flags || '');
    return {ok: true, regex};
  } catch (e) {
    return {ok: false, error: e?.message || 'Invalid regex.'};
  }
}

/**
 * Run a regex against `text` and return all matches.
 *
 * Returns an array of `{match, index, groups, namedGroups}`. Each match
 * is the full match string; `groups` is the array of capture groups (in
 * order, 1-based stored as 0-indexed); `namedGroups` is the (?<name>...)
 * map.
 *
 * If `g` flag is absent, returns at most one match (consistent with
 * `String.prototype.match`).
 *
 * Guards against infinite loops on zero-width matches.
 */
export function findMatches(regex, text) {
  if (!regex || typeof text !== 'string') return [];
  const out = [];
  if (!regex.global) {
    const m = regex.exec(text);
    if (m) {
      out.push({
        match: m[0],
        index: m.index,
        groups: m.slice(1),
        namedGroups: m.groups || null,
      });
    }
    return out;
  }
  // Reset lastIndex so we always start from the beginning.
  regex.lastIndex = 0;
  let m;
  let safety = 0;
  while ((m = regex.exec(text)) !== null) {
    out.push({
      match: m[0],
      index: m.index,
      groups: m.slice(1),
      namedGroups: m.groups || null,
    });
    // Advance past zero-width matches manually to avoid an infinite loop.
    if (m.index === regex.lastIndex) regex.lastIndex += 1;
    safety += 1;
    if (safety > 100000) break;
  }
  return out;
}

/**
 * Build segments of the test text for highlighting:
 *   [{text, isMatch, index}]
 *
 * Returns an alternating list of plain text and match segments suitable
 * for rendering as `<mark>` spans.
 */
export function buildHighlightSegments(text, matches) {
  if (!Array.isArray(matches) || matches.length === 0) {
    return [{text, isMatch: false, index: 0}];
  }
  const out = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.index > cursor) {
      out.push({
        text: text.slice(cursor, m.index),
        isMatch: false,
        index: cursor,
      });
    }
    const end = m.index + m.match.length;
    if (m.match.length > 0) {
      out.push({text: m.match, isMatch: true, index: m.index});
      cursor = end;
    }
    // Zero-width match: advance cursor by 0; skip to avoid duplicates.
  }
  if (cursor < text.length) {
    out.push({text: text.slice(cursor), isMatch: false, index: cursor});
  }
  return out;
}
