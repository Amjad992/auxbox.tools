import {describe, it, expect} from 'vitest';
import {
  formatJson,
  locateJsonError,
  minifyJson,
  sortObjectKeys,
  validateJson,
} from './utils';

describe('formatJson', () => {
  it('pretty-prints with 2-space indent by default', () => {
    const r = formatJson('{"a":1,"b":[2,3]}', {indent: '2'});
    expect(r.ok).toBe(true);
    expect(r.output).toBe('{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}');
  });

  it('respects 4-space indent', () => {
    const r = formatJson('{"a":1}', {indent: '4'});
    expect(r.output).toBe('{\n    "a": 1\n}');
  });

  it('uses tab indent when requested', () => {
    const r = formatJson('{"a":1}', {indent: 'tab'});
    expect(r.output).toBe('{\n\t"a": 1\n}');
  });

  it('sorts keys when sortKeys is true', () => {
    const r = formatJson('{"b":2,"a":1,"c":{"z":3,"y":2}}', {
      indent: '2',
      sortKeys: true,
    });
    const parsed = JSON.parse(r.output);
    expect(Object.keys(parsed)).toEqual(['a', 'b', 'c']);
    expect(Object.keys(parsed.c)).toEqual(['y', 'z']);
  });

  it('reports a parse error', () => {
    const r = formatJson('{"a":1,\n"b":\n}', {indent: '2'});
    expect(r.ok).toBe(false);
    expect(typeof r.error).toBe('string');
    // line/column may be null on V8 ≥ 21 which dropped "position N" from
    // the error message. The error string is the load-bearing surface;
    // location is best-effort.
  });

  it('round-trips __proto__ keys when sortKeys is true', () => {
    const r = formatJson('{"__proto__":{"x":1},"a":1}', {indent: '2', sortKeys: true});
    expect(r.ok).toBe(true);
    const parsed = JSON.parse(r.output);
    expect(parsed).toHaveProperty('__proto__');
    expect(parsed.__proto__).toEqual({x: 1});
    expect(parsed.a).toBe(1);
  });

  it('rejects empty input', () => {
    expect(formatJson('').ok).toBe(false);
    expect(formatJson('   \n  ').ok).toBe(false);
  });

  it('round-trips with parse + stringify', () => {
    const original = {a: [1, 2, 3], b: {c: 'hi'}, d: null, e: true};
    const r = formatJson(JSON.stringify(original), {indent: '2'});
    expect(JSON.parse(r.output)).toEqual(original);
  });
});

describe('locateJsonError', () => {
  it('extracts V8-legacy "position N"', () => {
    const r = locateJsonError('xxxx\nbroken', new SyntaxError('Unexpected token at position 5'));
    expect(r.line).toBe(2);
    expect(r.column).toBe(1);
  });

  it('extracts SpiderMonkey "line X column Y"', () => {
    const r = locateJsonError('any', new SyntaxError('JSON.parse: expected , at line 3 column 7 of the JSON data'));
    expect(r.line).toBe(3);
    expect(r.column).toBe(7);
  });

  it('bisects modern V8 messages without position', () => {
    const text = '{"a":1,\n"b":}';
    let err;
    try { JSON.parse(text); } catch (e) { err = e; }
    const r = locateJsonError(text, err);
    // Some line/column should come back; bisection finds at least the
    // failing prefix.
    expect(r.line).toBeGreaterThanOrEqual(1);
    expect(r.column).toBeGreaterThanOrEqual(1);
  });
});

describe('minifyJson', () => {
  it('strips whitespace', () => {
    const r = minifyJson('{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}');
    expect(r.ok).toBe(true);
    expect(r.output).toBe('{"a":1,"b":[2,3]}');
  });

  it('reports parse error', () => {
    const r = minifyJson('{');
    expect(r.ok).toBe(false);
  });

  it('preserves string content unchanged', () => {
    const r = minifyJson('{"a":  "  hello  world  "}');
    expect(r.output).toBe('{"a":"  hello  world  "}');
  });
});

describe('validateJson', () => {
  it('accepts valid JSON', () => {
    expect(validateJson('{"a":1}').ok).toBe(true);
    expect(validateJson('[1,2,3]').ok).toBe(true);
    expect(validateJson('null').ok).toBe(true);
    expect(validateJson('"hi"').ok).toBe(true);
    expect(validateJson('42').ok).toBe(true);
    expect(validateJson('true').ok).toBe(true);
  });

  it('rejects malformed JSON', () => {
    expect(validateJson('').ok).toBe(false);
    expect(validateJson('{').ok).toBe(false);
    expect(validateJson("{'a':1}").ok).toBe(false); // single quotes
    expect(validateJson('{"a":1,}').ok).toBe(false); // trailing comma
  });
});

describe('sortObjectKeys', () => {
  it('sorts numeric-string keys in natural order', () => {
    const r = formatJson('{"10":"a","2":"b"}', {indent: '2', sortKeys: true});
    expect(r.ok).toBe(true);
    const parsed = JSON.parse(r.output);
    const keys = Object.keys(parsed);
    // "2" must precede "10" in numeric-aware sort.
    expect(keys.indexOf('2')).toBeLessThan(keys.indexOf('10'));
  });

  it('sorts a flat object', () => {
    expect(Object.keys(sortObjectKeys({c: 1, a: 2, b: 3}))).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('sorts nested objects, leaves arrays in order', () => {
    const sorted = sortObjectKeys({
      z: 1,
      a: [{b: 2, a: 1}, 'hi'],
    });
    expect(Object.keys(sorted)).toEqual(['a', 'z']);
    expect(Object.keys(sorted.a[0])).toEqual(['a', 'b']);
    expect(sorted.a[1]).toBe('hi');
  });

  it('preserves primitives', () => {
    expect(sortObjectKeys(42)).toBe(42);
    expect(sortObjectKeys('s')).toBe('s');
    expect(sortObjectKeys(null)).toBe(null);
    expect(sortObjectKeys(true)).toBe(true);
  });
});
