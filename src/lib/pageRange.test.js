import {describe, it, expect} from 'vitest';
import {formatPageRange, parsePageRange} from './pageRange';

describe('parsePageRange', () => {
  it('treats empty/whitespace input as all pages', () => {
    expect(parsePageRange('', 3)).toEqual({indices: [0, 1, 2]});
    expect(parsePageRange('   ', 5)).toEqual({indices: [0, 1, 2, 3, 4]});
    expect(parsePageRange(undefined, 2)).toEqual({indices: [0, 1]});
  });

  it('parses a simple range', () => {
    expect(parsePageRange('1-3', 5)).toEqual({indices: [0, 1, 2]});
  });

  it('parses singletons and ranges combined', () => {
    expect(parsePageRange('1,3-4,6', 10)).toEqual({
      indices: [0, 2, 3, 5],
    });
  });

  it('preserves duplicate / overlapping pages', () => {
    expect(parsePageRange('1,1-2', 5)).toEqual({indices: [0, 0, 1]});
  });

  it('errors on out-of-range page', () => {
    const r = parsePageRange('1-99', 5);
    expect(r.error).toMatch(/exceed/i);
  });

  it('errors on reversed range', () => {
    const r = parsePageRange('5-1', 10);
    expect(r.error).toMatch(/reversed/i);
  });

  it('errors on invalid syntax', () => {
    expect(parsePageRange('abc', 5).error).toMatch(/invalid/i);
    expect(parsePageRange('1-', 5).error).toMatch(/invalid/i);
    expect(parsePageRange('1--2', 5).error).toMatch(/invalid/i);
    expect(parsePageRange(',', 5).error).toMatch(/empty/i);
  });

  it('errors when pageCount is invalid', () => {
    expect(parsePageRange('1', 0).error).toMatch(/unknown/i);
    expect(parsePageRange('1', -1).error).toMatch(/unknown/i);
  });
});

describe('formatPageRange', () => {
  it('returns empty for empty input', () => {
    expect(formatPageRange([])).toBe('');
    expect(formatPageRange(null)).toBe('');
  });

  it('formats a contiguous run as a-b', () => {
    expect(formatPageRange([0, 1, 2, 3])).toBe('1-4');
  });

  it('formats singletons', () => {
    expect(formatPageRange([0, 2, 5])).toBe('1,3,6');
  });

  it('mixes runs and singletons', () => {
    expect(formatPageRange([0, 1, 2, 4, 6, 7])).toBe('1-3,5,7-8');
  });

  it('handles a single page', () => {
    expect(formatPageRange([4])).toBe('5');
  });
});
