// JSON Formatter — pure helpers.

/** Indent → JSON.stringify indent argument. */
function indentToReplacer(indent) {
  if (indent === 'tab') return '\t';
  const n = parseInt(indent, 10);
  return Number.isFinite(n) && n > 0 ? n : 2;
}

/** Recursively sort object keys alphabetically. Arrays preserve order. */
export function sortObjectKeys(value) {
  if (Array.isArray(value)) return value.map(sortObjectKeys);
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    const out = {};
    for (const k of keys) out[k] = sortObjectKeys(value[k]);
    return out;
  }
  return value;
}

/**
 * Translate `JSON.parse` errors into a `{line, column, message}` for the
 * inline error UI. V8 uses "Unexpected token X in JSON at position N";
 * SpiderMonkey uses "JSON.parse: ... at line X column Y". We try the
 * V8 path first (most common), else fall back to the message text.
 */
export function locateJsonError(text, error) {
  const msg = error?.message ?? String(error);
  const posMatch = msg.match(/position\s+(\d+)/i);
  if (posMatch) {
    const pos = parseInt(posMatch[1], 10);
    return {...lineCol(text, pos), message: msg};
  }
  const lineMatch = msg.match(/line\s+(\d+)\s+column\s+(\d+)/i);
  if (lineMatch) {
    return {
      line: parseInt(lineMatch[1], 10),
      column: parseInt(lineMatch[2], 10),
      message: msg,
    };
  }
  return {line: null, column: null, message: msg};
}

function lineCol(text, pos) {
  let line = 1;
  let column = 1;
  for (let i = 0; i < pos && i < text.length; i++) {
    if (text[i] === '\n') {
      line++;
      column = 1;
    } else {
      column++;
    }
  }
  return {line, column};
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
