import {describe, it, expect} from 'vitest';
import {
  csvToJson,
  detectDelimiter,
  inferType,
  jsonToCsv,
  parseCsv,
} from './utils';

describe('parseCsv', () => {
  it('parses a simple comma CSV', () => {
    expect(parseCsv('a,b,c\n1,2,3', ',')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });

  it('handles CRLF and LF endings', () => {
    expect(parseCsv('a,b\r\n1,2\n3,4', ',')).toEqual([
      ['a', 'b'],
      ['1', '2'],
      ['3', '4'],
    ]);
  });

  it('handles quoted fields with embedded commas', () => {
    expect(parseCsv('a,b\n"hello, world",2', ',')).toEqual([
      ['a', 'b'],
      ['hello, world', '2'],
    ]);
  });

  it('escapes "" inside quoted fields', () => {
    expect(parseCsv('a\n"she said ""hi"""', ',')).toEqual([
      ['a'],
      ['she said "hi"'],
    ]);
  });

  it('handles tab + semicolon delimiters', () => {
    expect(parseCsv('a;b;c\n1;2;3', ';')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
    expect(parseCsv('a\tb\n1\t2', '\t')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('returns empty array for empty input', () => {
    expect(parseCsv('', ',')).toEqual([]);
  });

  it('preserves trailing empty fields', () => {
    expect(parseCsv('a,b,\n1,,3', ',')).toEqual([
      ['a', 'b', ''],
      ['1', '', '3'],
    ]);
  });

  // S1 — mid-field stray quote
  it('handles a stray quote inside an unquoted field', () => {
    expect(parseCsv("name\nit's a test\nfine", ',')).toEqual([
      ['name'],
      ["it's a test"],
      ['fine'],
    ]);
  });

  // S2 — UTF-8 BOM
  it('strips a leading UTF-8 BOM', () => {
    const bom = '﻿';
    const r = parseCsv(`${bom}a,b\n1,2`, ',');
    expect(r[0][0]).toBe('a');
  });

  // S12 — blank rows
  it('filters blank rows (double newline)', () => {
    expect(parseCsv('a,b\n\n1,2', ',')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });
});

describe('detectDelimiter', () => {
  it('picks comma by default', () => {
    expect(detectDelimiter('a,b,c\n1,2,3')).toBe(',');
  });

  it('picks tab when tab-separated', () => {
    expect(detectDelimiter('a\tb\tc\n1\t2\t3')).toBe('\t');
  });

  it('picks semicolon when semicolons dominate', () => {
    expect(detectDelimiter('a;b;c\n1;2;3')).toBe(';');
  });

  it("doesn't get confused by delimiters inside quotes", () => {
    expect(detectDelimiter('a;b;"foo,bar,baz"\n1;2;3')).toBe(';');
  });

  it('returns comma when input is empty', () => {
    expect(detectDelimiter('')).toBe(',');
  });
});

describe('inferType', () => {
  it('coerces "true"/"false"/"null"', () => {
    expect(inferType('true')).toBe(true);
    expect(inferType('false')).toBe(false);
    expect(inferType('null')).toBeNull();
  });

  it('coerces numbers', () => {
    expect(inferType('42')).toBe(42);
    expect(inferType('-3.14')).toBe(-3.14);
    expect(inferType('1e3')).toBe(1000);
  });

  it('keeps non-numeric strings', () => {
    expect(inferType('hello')).toBe('hello');
    expect(inferType('123abc')).toBe('123abc');
    expect(inferType('')).toBe('');
  });

  it('keeps non-string input intact', () => {
    expect(inferType(42)).toBe(42);
    expect(inferType(true)).toBe(true);
    expect(inferType(null)).toBeNull();
  });

  // S3 — leading-zero rejection
  it('preserves leading-zero strings as strings', () => {
    expect(inferType('007')).toBe('007');
    expect(inferType('01')).toBe('01');
  });

  // S3 — unsafe integer rejection
  it('preserves unsafe integers as strings', () => {
    expect(inferType('9007199254740993')).toBe('9007199254740993');
  });

  // S3 — safe float / scientific notation still coerces
  it('coerces floats and scientific notation', () => {
    expect(inferType('3.14')).toBe(3.14);
    expect(inferType('1e3')).toBe(1000);
  });
});

describe('csvToJson', () => {
  it('returns array-of-objects with header row', () => {
    const r = csvToJson('a,b\n1,2\n3,4');
    expect(r.ok).toBe(true);
    expect(r.value).toEqual([
      {a: 1, b: 2},
      {a: 3, b: 4},
    ]);
  });

  it('returns array-of-arrays without header', () => {
    const r = csvToJson('1,2\n3,4', {hasHeader: false});
    expect(r.value).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it('respects inferTypes=false', () => {
    const r = csvToJson('a,b\n1,2', {inferTypes: false});
    expect(r.value).toEqual([{a: '1', b: '2'}]);
  });

  it('fills missing cells with empty string', () => {
    const r = csvToJson('a,b,c\n1,2');
    expect(r.value).toEqual([{a: 1, b: 2, c: ''}]);
  });

  it('reports the detected delimiter', () => {
    const r = csvToJson('a;b\n1;2');
    expect(r.delimiter).toBe(';');
  });

  // S9 — duplicate headers
  it('dedupes duplicate header names with _2, _3 suffixes', () => {
    const r = csvToJson('a,a,a\n1,2,3');
    expect(r.ok).toBe(true);
    expect(r.value[0]).toEqual({a: 1, a_2: 2, a_3: 3});
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  // S10 — header-only CSV
  it('returns empty array and warning for header-only CSV', () => {
    const r = csvToJson('a,b,c');
    expect(r.ok).toBe(true);
    expect(r.value).toEqual([]);
    expect(r.warnings).toContain('Header row only — no data rows.');
  });
});

describe('jsonToCsv', () => {
  it('serializes array-of-objects with first-seen-order header', () => {
    const r = jsonToCsv([
      {a: 1, b: 2},
      {b: 4, c: 5},
    ]);
    expect(r.ok).toBe(true);
    expect(r.output).toBe('a,b,c\n1,2,\n,4,5');
  });

  it('serializes array-of-arrays without header', () => {
    const r = jsonToCsv([
      [1, 2],
      [3, 4],
    ]);
    expect(r.output).toBe('1,2\n3,4');
  });

  it('quotes fields that contain delimiter, quote, or newline', () => {
    const r = jsonToCsv([{a: 'hello, world', b: 'she said "hi"'}]);
    expect(r.output).toBe('a,b\n"hello, world","she said ""hi"""');
  });

  it('rejects non-array input', () => {
    const r = jsonToCsv('{"a":1}');
    expect(r.ok).toBe(false);
  });

  it('parses a JSON string input', () => {
    const r = jsonToCsv('[{"a":1,"b":2}]');
    expect(r.output).toBe('a,b\n1,2');
  });

  it('reports invalid JSON string', () => {
    const r = jsonToCsv('not json');
    expect(r.ok).toBe(false);
    expect(typeof r.error).toBe('string');
  });

  it('handles empty array', () => {
    const r = jsonToCsv([]);
    expect(r.output).toBe('');
  });

  // S4 — mixed shape rejection
  it('rejects mixed arrays and objects', () => {
    const r = jsonToCsv([[1, 2], {a: 3}]);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/same shape/i);
  });

  // S6 — line/column in JSON parse error
  it('returns line and column for invalid JSON input', () => {
    const r = jsonToCsv('not json');
    expect(r.ok).toBe(false);
    // line and column are either numbers or null (best-effort from locateJsonError)
    expect(r).toHaveProperty('line');
    expect(r).toHaveProperty('column');
  });

  // S11 — NaN/Infinity in JSON→CSV
  it('replaces NaN and Infinity with empty cells and warns', () => {
    const r = jsonToCsv([{a: NaN, b: Infinity, c: 1}]);
    expect(r.ok).toBe(true);
    // Both non-finite cells become empty
    expect(r.output).toBe('a,b,c\n,,1');
    expect(r.warnings.length).toBeGreaterThanOrEqual(2);
  });

  // S13 — nested objects warn
  it('serialises nested objects as JSON strings and warns', () => {
    const r = jsonToCsv([{a: {x: 1}, b: 2}]);
    expect(r.ok).toBe(true);
    // The JSON string gets CSV-quoted since it contains double-quotes.
    expect(r.output).toContain('"{""x"":1}"');
    expect(r.warnings.some((w) => /nested/i.test(w))).toBe(true);
  });
});

describe('round-trip', () => {
  it('CSV → JSON → CSV preserves the data', () => {
    const csv = 'name,age\nAlice,30\nBob,25';
    const json = csvToJson(csv).value;
    const back = jsonToCsv(json).output;
    expect(back).toBe(csv);
  });
});
