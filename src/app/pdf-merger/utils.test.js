import {describe, it, expect} from 'vitest';
import {
  reorder,
  parsePageRange,
  validateAdditions,
  mergedFilename,
} from './utils';
import {MAX_FILE_BYTES, MAX_FILES, MERGED_FILENAME} from './constants';

function makePdf(name = 'doc.pdf', size = 1024) {
  // Build a File with a fixed reported size by providing a Blob of that size.
  const buf = new Uint8Array(size);
  return new File([buf], name, {type: 'application/pdf'});
}

describe('reorder', () => {
  it('moves an item forward', () => {
    expect(reorder(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
  });

  it('moves an item backward', () => {
    expect(reorder(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c']);
  });

  it('returns a copy on a no-op move (from === to)', () => {
    const input = ['a', 'b', 'c'];
    const out = reorder(input, 1, 1);
    expect(out).toEqual(['a', 'b', 'c']);
    expect(out).not.toBe(input);
  });

  it('returns a copy when indices are out of bounds', () => {
    const input = ['a', 'b'];
    expect(reorder(input, -1, 0)).toEqual(['a', 'b']);
    expect(reorder(input, 0, 5)).toEqual(['a', 'b']);
    expect(reorder(input, 5, 0)).toEqual(['a', 'b']);
  });

  it('handles edge indices (move last to first)', () => {
    expect(reorder(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
  });

  it('does not mutate the input array', () => {
    const input = ['a', 'b', 'c'];
    reorder(input, 0, 2);
    expect(input).toEqual(['a', 'b', 'c']);
  });

  it('returns [] for non-array input', () => {
    expect(reorder(null, 0, 0)).toEqual([]);
    expect(reorder(undefined, 0, 0)).toEqual([]);
  });
});

describe('parsePageRange', () => {
  it('returns all indices for empty input', () => {
    expect(parsePageRange('', 3)).toEqual({indices: [0, 1, 2]});
  });

  it('returns all indices for whitespace-only input', () => {
    expect(parsePageRange('   ', 4)).toEqual({indices: [0, 1, 2, 3]});
  });

  it('returns all indices for null/undefined input', () => {
    expect(parsePageRange(null, 2)).toEqual({indices: [0, 1]});
    expect(parsePageRange(undefined, 2)).toEqual({indices: [0, 1]});
  });

  it('parses a single range "1-3"', () => {
    expect(parsePageRange('1-3', 5)).toEqual({indices: [0, 1, 2]});
  });

  it('parses a list of singletons "1,3,5"', () => {
    expect(parsePageRange('1,3,5', 5)).toEqual({indices: [0, 2, 4]});
  });

  it('parses mixed ranges + singletons "1-3,5,7-9"', () => {
    expect(parsePageRange('1-3,5,7-9', 9)).toEqual({
      indices: [0, 1, 2, 4, 6, 7, 8],
    });
  });

  it('tolerates whitespace within tokens "1 - 3 , 5"', () => {
    expect(parsePageRange('1 - 3 , 5', 5)).toEqual({indices: [0, 1, 2, 4]});
  });

  it('accepts a single page "5"', () => {
    expect(parsePageRange('5', 5)).toEqual({indices: [4]});
  });

  it('rejects trailing dash "1-"', () => {
    const r = parsePageRange('1-', 5);
    expect(r).toHaveProperty('error');
  });

  it('rejects leading dash "-3"', () => {
    const r = parsePageRange('-3', 5);
    expect(r).toHaveProperty('error');
  });

  it('rejects non-numeric "abc"', () => {
    const r = parsePageRange('abc', 5);
    expect(r).toHaveProperty('error');
  });

  it('rejects mixed valid + invalid "1-3,abc"', () => {
    const r = parsePageRange('1-3,abc', 5);
    expect(r).toHaveProperty('error');
  });

  it('rejects empty segment "1,,3"', () => {
    const r = parsePageRange('1,,3', 5);
    expect(r).toHaveProperty('error');
  });

  it('rejects out-of-range page "5-10" for a 3-page doc', () => {
    const r = parsePageRange('5-10', 3);
    expect(r).toHaveProperty('error');
    expect(r.error).toMatch(/3 pages/);
  });

  it('rejects out-of-range single page "10" for a 3-page doc', () => {
    const r = parsePageRange('10', 3);
    expect(r).toHaveProperty('error');
  });

  it('rejects reversed range "5-3"', () => {
    const r = parsePageRange('5-3', 5);
    expect(r).toHaveProperty('error');
    expect(r.error).toMatch(/reversed/);
  });

  it('rejects zero "0"', () => {
    expect(parsePageRange('0', 5)).toHaveProperty('error');
  });

  it('rejects negative "-1"', () => {
    expect(parsePageRange('-1', 5)).toHaveProperty('error');
  });

  it('rejects fractional "1.5"', () => {
    expect(parsePageRange('1.5', 5)).toHaveProperty('error');
  });

  it('rejects multi-dash range "1-2-3"', () => {
    expect(parsePageRange('1-2-3', 5)).toHaveProperty('error');
  });

  it('errors when pageCount is invalid', () => {
    expect(parsePageRange('1', 0)).toHaveProperty('error');
    expect(parsePageRange('1', -1)).toHaveProperty('error');
    expect(parsePageRange('1', 1.5)).toHaveProperty('error');
  });

  // MIN-3: scientific notation, leading +, hex literals must be rejected
  it('rejects scientific notation "1e2" (MIN-3)', () => {
    expect(parsePageRange('1e2', 200)).toHaveProperty('error');
  });

  it('rejects leading-plus "+5" (MIN-3)', () => {
    expect(parsePageRange('+5', 10)).toHaveProperty('error');
  });

  it('rejects hex literal "0x3" (MIN-3)', () => {
    expect(parsePageRange('0x3', 10)).toHaveProperty('error');
  });

  it('rejects "1-1e2" range where upper bound is scientific notation (MIN-3)', () => {
    expect(parsePageRange('1-1e2', 200)).toHaveProperty('error');
  });
});

describe('validateAdditions', () => {
  it('accepts well-formed PDFs under all caps', () => {
    const a = makePdf('a.pdf', 100);
    const b = makePdf('b.pdf', 200);
    const {accepted, rejected} = validateAdditions([], [a, b]);
    expect(accepted).toHaveLength(2);
    expect(rejected).toHaveLength(0);
  });

  it('rejects oversized files with the size message', () => {
    const big = makePdf('big.pdf', MAX_FILE_BYTES + 1);
    const {accepted, rejected} = validateAdditions([], [big]);
    expect(accepted).toHaveLength(0);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toMatch(/larger than 50 MB/i);
  });

  it('rejects non-PDF MIME', () => {
    const png = new File([new Uint8Array(10)], 'img.png', {type: 'image/png'});
    const {accepted, rejected} = validateAdditions([], [png]);
    expect(accepted).toHaveLength(0);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toMatch(/only accepts application\/pdf/i);
  });

  it('falls back to .pdf extension when type is empty', () => {
    const file = new File([new Uint8Array(10)], 'doc.pdf', {type: ''});
    const {accepted, rejected} = validateAdditions([], [file]);
    expect(accepted).toHaveLength(1);
    expect(rejected).toHaveLength(0);
  });

  it('rejects files when total count would exceed MAX_FILES', () => {
    const current = Array.from({length: MAX_FILES}, (_, i) =>
      ({id: `id-${i}`, file: makePdf(`f${i}.pdf`)}));
    const extra = makePdf('extra.pdf');
    const {accepted, rejected} = validateAdditions(current, [extra]);
    expect(accepted).toHaveLength(0);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toMatch(/limit of/i);
  });

  it('partially accepts up to remaining slots', () => {
    const current = Array.from({length: MAX_FILES - 1}, (_, i) =>
      ({id: `id-${i}`, file: makePdf(`f${i}.pdf`)}));
    const a = makePdf('a.pdf');
    const b = makePdf('b.pdf');
    const c = makePdf('c.pdf');
    const {accepted, rejected} = validateAdditions(current, [a, b, c]);
    expect(accepted).toHaveLength(1);
    expect(rejected).toHaveLength(2);
  });

  it('reports each rejection independently (mixed batch)', () => {
    const ok = makePdf('ok.pdf');
    const big = makePdf('big.pdf', MAX_FILE_BYTES + 1);
    const png = new File([new Uint8Array(10)], 'img.png', {type: 'image/png'});
    const {accepted, rejected} = validateAdditions([], [ok, big, png]);
    expect(accepted).toHaveLength(1);
    expect(rejected).toHaveLength(2);
  });
});

describe('mergedFilename', () => {
  it('returns merged.pdf', () => {
    expect(mergedFilename()).toBe(MERGED_FILENAME);
  });
});
