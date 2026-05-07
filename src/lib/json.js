/**
 * Translate `JSON.parse` errors into a `{line, column, message}` for
 * inline error UIs. V8 uses "Unexpected token X in JSON at position N";
 * SpiderMonkey uses "JSON.parse: ... at line X column Y". Tries the
 * V8 path first (most common), then SpiderMonkey, then a binary-search
 * fallback for modern V8 (≥21) which dropped the "position N" suffix.
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
  // Modern V8 (≥21) omits position from the error message. When we still
  // have the source text and it is small enough, binary-search the first
  // prefix that fails parsing to recover an approximate line/column.
  if (text.length <= 1_000_000) {
    let lo = 0;
    let hi = text.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      try {
        JSON.parse(text.slice(0, mid));
        lo = mid + 1;
      } catch {
        hi = mid;
      }
    }
    // hi is the length of the shortest prefix that fails; the last character
    // of that prefix (index hi-1) is the first offending byte.
    const pos = Math.max(0, hi - 1);
    return {...lineCol(text, pos), message: msg};
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
