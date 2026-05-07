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
});

describe('round-trip', () => {
  it('CSV → JSON → CSV preserves the data', () => {
    const csv = 'name,age\nAlice,30\nBob,25';
    const json = csvToJson(csv).value;
    const back = jsonToCsv(json).output;
    expect(back).toBe(csv);
  });
});
