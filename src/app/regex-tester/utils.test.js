import {describe, it, expect} from 'vitest';
import {buildHighlightSegments, compileRegex, findMatches} from './utils';

describe('compileRegex', () => {
  it('compiles a valid pattern', () => {
    const r = compileRegex('foo', 'g');
    expect(r.ok).toBe(true);
    expect(r.regex).toBeInstanceOf(RegExp);
    expect(r.regex.source).toBe('foo');
    expect(r.regex.flags).toBe('g');
  });

  it('rejects an empty pattern', () => {
    expect(compileRegex('', 'g').ok).toBe(false);
  });

  it('returns the engine error on invalid syntax', () => {
    const r = compileRegex('(', 'g');
    expect(r.ok).toBe(false);
    expect(r.error.toLowerCase()).toMatch(/group|paren|syntax|unterminated|invalid/);
  });

  it('rejects invalid flag combinations', () => {
    expect(compileRegex('foo', 'zz').ok).toBe(false);
  });
});

describe('findMatches', () => {
  it('returns empty for null regex or non-string text', () => {
    expect(findMatches(null, 'abc')).toEqual([]);
    expect(findMatches(/a/, null)).toEqual([]);
    expect(findMatches(/a/, 12)).toEqual([]);
  });

  it('returns at most one match for a non-global regex', () => {
    const r = findMatches(/a/, 'aaa');
    expect(r).toHaveLength(1);
    expect(r[0].match).toBe('a');
    expect(r[0].index).toBe(0);
  });

  it('returns all matches for a global regex', () => {
    const r = findMatches(/a/g, 'aaa');
    expect(r).toHaveLength(3);
    expect(r.map((x) => x.index)).toEqual([0, 1, 2]);
  });

  it('captures groups', () => {
    const r = findMatches(/(\w+)@(\w+)/g, 'foo@bar baz@qux');
    expect(r).toHaveLength(2);
    expect(r[0].groups).toEqual(['foo', 'bar']);
    expect(r[1].groups).toEqual(['baz', 'qux']);
  });

  it('captures named groups', () => {
    const r = findMatches(/(?<user>\w+)@(?<host>\w+)/g, 'a@b');
    expect(r[0].namedGroups).toEqual({user: 'a', host: 'b'});
  });

  it('does not infinite-loop on zero-width matches', () => {
    const r = findMatches(/a*/g, 'aaa');
    // 4 matches: at indices 0, 1, 2, 3 (zero-width at end).
    expect(r.length).toBeGreaterThanOrEqual(1);
    expect(r.length).toBeLessThan(20);
  });
});

describe('buildHighlightSegments', () => {
  it('returns the whole string when there are no matches', () => {
    const segs = buildHighlightSegments('hello world', []);
    expect(segs).toEqual([{text: 'hello world', isMatch: false, index: 0}]);
  });

  it('alternates plain + match segments', () => {
    const text = 'abcXYZabcXYZ';
    const matches = [
      {match: 'XYZ', index: 3, groups: [], namedGroups: null},
      {match: 'XYZ', index: 9, groups: [], namedGroups: null},
    ];
    const segs = buildHighlightSegments(text, matches);
    // Expected: ['abc', '<XYZ>', 'abc', '<XYZ>'].
    expect(segs.map((s) => s.text)).toEqual(['abc', 'XYZ', 'abc', 'XYZ']);
    expect(segs.map((s) => s.isMatch)).toEqual([false, true, false, true]);
  });

  it('handles a leading match', () => {
    const segs = buildHighlightSegments('abc', [
      {match: 'a', index: 0, groups: [], namedGroups: null},
    ]);
    expect(segs).toEqual([
      {text: 'a', isMatch: true, index: 0},
      {text: 'bc', isMatch: false, index: 1},
    ]);
  });

  it('handles a trailing match', () => {
    const segs = buildHighlightSegments('abc', [
      {match: 'c', index: 2, groups: [], namedGroups: null},
    ]);
    expect(segs.map((s) => s.text)).toEqual(['ab', 'c']);
  });

  it('skips zero-width matches', () => {
    const segs = buildHighlightSegments('abc', [
      {match: '', index: 0, groups: [], namedGroups: null},
    ]);
    // Zero-width match shouldn't produce an empty <mark>.
    expect(segs).toEqual([{text: 'abc', isMatch: false, index: 0}]);
  });
});
