// Hand-rolled CSV parser supporting:
//   - quoted fields (double-quotes), with `""` as escape.
//   - common delimiters: `,`, `;`, `\t`, `|`.
//   - CR/LF/CRLF row endings.
//
// JSON output supports two shapes (with and without header) and an
// optional type-inference pass that turns "42" → 42, "true" → true, etc.

import {locateJsonError} from '../../lib/json';

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
 * Parse CSV text → array of row arrays. Common-CSV (LF row endings; quoted fields):
 *   - quoted fields wrap with `"`.
 *   - escape: `""` → `"`.
 *   - delimiter must be a single character.
 *   - newlines: \n, \r, \r\n all count.
 */
export function parseCsv(text, delimiter) {
  if (typeof text !== 'string' || text === '') return [];
  // Strip UTF-8 BOM if present.
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
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
      // Only enter quoted mode when the field buffer is empty; otherwise
      // treat the quote as a literal character (mid-field stray quote).
      if (field === '') {
        inQuotes = true;
      } else {
        field += ch;
      }
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
  // Drop blank rows (double-newline / trailing newline → single-field empty row).
  return rows.filter((r) => !(r.length === 1 && r[0] === ''));
}

/**
 * Coerce a string to a typed value (number / boolean / null) when sensible.
 * @remarks ASCII numerics only; "1.234,56" (EU locale) is left as a string.
 */
export function inferType(value) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (trimmed === '') return value; // keep empty strings as-is
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  // Reject leading-zero numerics (preserves ZIP codes, "007", etc.).
  if (/^-?0\d/.test(trimmed)) return value;
  // Numeric: integer or float, optional sign.
  if (/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(trimmed)) {
    const n = Number(trimmed);
    if (!Number.isFinite(n)) return value;
    // For integers, only coerce when representable exactly.
    if (Number.isInteger(n) && !Number.isSafeInteger(n)) return value;
    return n;
  }
  return value;
}

/**
 * CSV → JSON.
 * - When `hasHeader`, first row becomes property names → array of objects.
 * - Without header, returns array of arrays.
 * - When `inferTypes`, every cell goes through `inferType`.
 * - Duplicate header names are deduped: second occurrence → `name_2`, third → `name_3`, etc.
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
  const warnings = [];

  // Header-only CSV with no data rows.
  if (body.length === 0) {
    warnings.push('Header row only — no data rows.');
    return {ok: true, value: [], delimiter: d, warnings};
  }

  // Build deduped header keys.
  const keyCount = new Map();
  const keys = header.map((h) => {
    const base = h || `col${header.indexOf(h) + 1}`;
    const count = (keyCount.get(base) ?? 0) + 1;
    keyCount.set(base, count);
    if (count > 1) {
      warnings.push(`Duplicate header "${base}" renamed to "${base}_${count}".`);
      return `${base}_${count}`;
    }
    return base;
  });

  const value = body.map((r) => {
    const obj = {};
    for (let i = 0; i < keys.length; i++) {
      obj[keys[i]] = maybeInfer(r[i] ?? '');
    }
    return obj;
  });
  return {ok: true, value, delimiter: d, warnings};
}

/**
 * JSON → CSV.
 * Accepts either a JSON string or a parsed value (array of objects, or
 * array of arrays). Returns `{ok, output, error?, line?, column?, warnings?}`.
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
      const {line, column, message} = locateJsonError(input, e);
      return {ok: false, error: message, line, column};
    }
  }
  if (!Array.isArray(parsed)) {
    return {ok: false, error: 'JSON must be an array of objects or arrays.'};
  }
  if (parsed.length === 0) {
    return {ok: true, output: ''};
  }
  const isArrayOfArrays = parsed.every((r) => Array.isArray(r));
  // Reject mixed shapes.
  if (!isArrayOfArrays && parsed.some((r) => Array.isArray(r))) {
    return {ok: false, error: 'All rows must be the same shape (all objects or all arrays).'};
  }

  const warnings = [];

  // Escape a cell value; track non-finite numbers and nested objects as warnings.
  function escapeCellWithWarnings(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number' && !Number.isFinite(value)) {
      // NaN / Infinity cannot be represented in CSV; emit empty string.
      warnings.push(`Non-finite number (${value}) replaced with empty cell.`);
      return '';
    }
    if (typeof value === 'object') {
      // Nested object/array: JSON-stringify and warn.
      warnings.push('Nested object or array serialised as JSON string in CSV cell.');
      const s = JSON.stringify(value);
      const needsQuote =
        s.includes(delimiter) || s.includes('"') || s.includes('\n') || s.includes('\r');
      if (!needsQuote) return s;
      return `"${s.replaceAll('"', '""')}"`;
    }
    const s = typeof value === 'string' ? value : String(value);
    const needsQuote =
      s.includes(delimiter) || s.includes('"') || s.includes('\n') || s.includes('\r');
    if (!needsQuote) return s;
    return `"${s.replaceAll('"', '""')}"`;
  }

  if (isArrayOfArrays) {
    const lines = parsed.map((r) =>
      r.map((c) => escapeCellWithWarnings(c)).join(delimiter)
    );
    return {ok: true, output: lines.join('\n'), warnings};
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
  const lines = [header.map((h) => escapeCellWithWarnings(h)).join(delimiter)];
  for (const obj of parsed) {
    lines.push(
      header.map((k) => escapeCellWithWarnings(obj[k])).join(delimiter)
    );
  }
  return {ok: true, output: lines.join('\n'), warnings};
}
