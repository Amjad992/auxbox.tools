// JSON Formatter — pure helpers.
import {locateJsonError} from '../../lib/json';
export {locateJsonError};

/** Indent → JSON.stringify indent argument. */
function indentToReplacer(indent) {
  if (indent === 'tab') return '\t';
  const n = parseInt(indent, 10);
  return Number.isFinite(n) && n > 0 ? n : 2;
}

/** Recursively sort object keys (numeric-aware). Arrays preserve order. */
export function sortObjectKeys(value) {
  if (Array.isArray(value)) return value.map(sortObjectKeys);
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort((a, b) =>
      a.localeCompare(b, undefined, {numeric: true})
    );
    // Use a null-prototype accumulator so that assigning a key named
    // "__proto__" creates an own data property rather than invoking the
    // Object.prototype setter.
    const out = Object.create(null);
    for (const k of keys) out[k] = sortObjectKeys(value[k]);
    return out;
  }
  return value;
}

/** Pretty-print JSON. */
export function formatJson(text, {indent = '2', sortKeys = false} = {}) {
  if (typeof text !== 'string' || text.trim() === '') {
    return {ok: false, error: 'Input is empty.', line: null, column: null};
  }
  try {
    let parsed = JSON.parse(text);
    if (sortKeys) parsed = sortObjectKeys(parsed);
    const output = JSON.stringify(parsed, null, indentToReplacer(indent));
    return {ok: true, output};
  } catch (e) {
    const {line, column, message} = locateJsonError(text, e);
    return {ok: false, error: message, line, column};
  }
}

/** Minify JSON (single line, no whitespace). */
export function minifyJson(text, {sortKeys = false} = {}) {
  if (typeof text !== 'string' || text.trim() === '') {
    return {ok: false, error: 'Input is empty.', line: null, column: null};
  }
  try {
    let parsed = JSON.parse(text);
    if (sortKeys) parsed = sortObjectKeys(parsed);
    return {ok: true, output: JSON.stringify(parsed)};
  } catch (e) {
    const {line, column, message} = locateJsonError(text, e);
    return {ok: false, error: message, line, column};
  }
}

/** Validate without producing output. */
export function validateJson(text) {
  if (typeof text !== 'string' || text.trim() === '') {
    return {ok: false, error: 'Input is empty.', line: null, column: null};
  }
  try {
    JSON.parse(text);
    return {ok: true};
  } catch (e) {
    const {line, column, message} = locateJsonError(text, e);
    return {ok: false, error: message, line, column};
  }
}
