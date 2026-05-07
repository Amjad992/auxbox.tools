// CSV ↔ JSON Converter — pure helpers.
//
// Hand-rolled CSV parser supporting:
//   - quoted fields (double-quotes), with `""` as escape.
//   - common delimiters: `,`, `;`, `\t`, `|`.
//   - CR/LF/CRLF row endings.
//
// JSON output supports two shapes (with and without header) and an
// optional type-inference pass that turns "42" → 42, "true" → true, etc.

const DELIM_CANDIDATES = [',', ';', '\t', '|'];

/** Detect the most likely delimiter by counting occurrences in the first
 * non-empty row that isn't inside a quoted string. Returns ',' if nothing
 * stands out.
 */
export function detectDelimiter(text) {
  if (typeof text !== 'string' || text === '') return ',';
  const sample = firstSampleLine(text);
  let best = ',';
  let bestCount = 0;
  for (const d of DELIM_CANDIDATES) {
    const count = countOutsideQuotes(sample, d);
    if (count > bestCount) {
      bestCount = count;
      best = d;
    }
  }
  return best;
}

function firstSampleLine(text) {
  // Sample the first ~2 KB or up to a real newline (outside quotes).
  let inQuotes = false;
  let out = '';
  for (let i = 0; i < text.length && i < 2048; i++) {
    const ch = text[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if ((ch === '\n' || ch === '\r') && !inQuotes) break;
    out += ch;
  }
  return out;
}

function countOutsideQuotes(line, delim) {
  let inQuotes = false;
  let count = 0;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === delim && !inQuotes) count++;
  }
  return count;
}

/**
 * Parse CSV text → array of row arrays. RFC 4180-ish:
 *   - quoted fields wrap with `"`.
 *   - escape: `""` → `"`.
 *   - delimiter must be a single character.
 *   - newlines: \n, \r, \r\n all count.
 */
export function parseCsv(text, delimiter) {
  if (typeof text !== 'string' || text === '') return [];
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === delimiter) {
      row.push(field);
      field = '';
      continue;
    }
    if (ch === '\r') {
      if (text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }
    if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }
    field += ch;
  }
  // Flush the final row if the input doesn't end with a newline.
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Coerce a string to a typed value (number / boolean / null) when sensible. */
export function inferType(value) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (trimmed === '') return value; // keep empty strings as-is
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  // Numeric: integer or float, optional sign.
  if (/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(trimmed)) {
    const n = Number(trimmed);
    if (Number.isFinite(n)) return n;
  }
  return value;
}

/**
 * CSV → JSON.
 * - When `hasHeader`, first row becomes property names → array of objects.
 * - Without header, returns array of arrays.
 * - When `inferTypes`, every cell goes through `inferType`.
 */
export function csvToJson(text, {delimiter, hasHeader = true, inferTypes = true} = {}) {
  const d = delimiter && delimiter !== 'auto' ? delimiter : detectDelimiter(text);
  const rows = parseCsv(text, d);
  if (rows.length === 0) {
    return {ok: true, value: [], delimiter: d};
  }
  const maybeInfer = (v) => (inferTypes ? inferType(v) : v);
  if (!hasHeader) {
    return {
      ok: true,
      value: rows.map((r) => r.map(maybeInfer)),
      delimiter: d,
    };
  }
  const [header, ...body] = rows;
  const value = body.map((r) => {
    const obj = {};
    for (let i = 0; i < header.length; i++) {
      obj[header[i] || `col${i + 1}`] = maybeInfer(r[i] ?? '');
    }
    return obj;
  });
  return {ok: true, value, delimiter: d};
}

/** Quote a field for CSV output if it contains delimiter, quote, or newline. */
function escapeCell(value, delimiter) {
  if (value === null || value === undefined) return '';
  const s = typeof value === 'string' ? value : JSON.stringify(value);
  const needsQuote =
    s.includes(delimiter) || s.includes('"') || s.includes('\n') || s.includes('\r');
  if (!needsQuote) return s;
  return `"${s.replaceAll('"', '""')}"`;
}

/**
 * JSON → CSV.
 * Accepts either a JSON string or a parsed value (array of objects, or
 * array of arrays). Returns `{ok, output, error?}`.
 *
 * - For array-of-objects: header row built from union of keys (preserves
 *   first-seen order).
 * - For array-of-arrays: rows passed through verbatim; no header.
 */
export function jsonToCsv(input, {delimiter = ','} = {}) {
  let parsed = input;
  if (typeof input === 'string') {
    try {
      parsed = JSON.parse(input);
    } catch (e) {
      return {ok: false, error: e?.message || 'Invalid JSON.'};
    }
  }
  if (!Array.isArray(parsed)) {
    return {ok: false, error: 'JSON must be an array of objects or arrays.'};
  }
  if (parsed.length === 0) {
    return {ok: true, output: ''};
  }
  const isArrayOfArrays = parsed.every((r) => Array.isArray(r));
  if (isArrayOfArrays) {
    const lines = parsed.map((r) =>
      r.map((c) => escapeCell(c, delimiter)).join(delimiter)
    );
    return {ok: true, output: lines.join('\n')};
  }
  // Build header in first-seen order.
  const header = [];
  const seen = new Set();
  for (const obj of parsed) {
    if (!obj || typeof obj !== 'object') {
      return {
        ok: false,
        error: 'Every row must be an object or an array.',
      };
    }
    for (const k of Object.keys(obj)) {
      if (!seen.has(k)) {
        seen.add(k);
        header.push(k);
      }
    }
  }
  const lines = [header.map((h) => escapeCell(h, delimiter)).join(delimiter)];
  for (const obj of parsed) {
    lines.push(
      header.map((k) => escapeCell(obj[k], delimiter)).join(delimiter)
    );
  }
  return {ok: true, output: lines.join('\n')};
}
