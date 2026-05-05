import {describe, it, expect} from 'vitest';
import {formatBytes, formatPercent} from './format';

describe('formatBytes', () => {
  it('returns 0 B for zero', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('formats raw bytes as integers', () => {
    expect(formatBytes(1)).toBe('1 B');
    expect(formatBytes(500)).toBe('500 B');
    expect(formatBytes(1023)).toBe('1023 B');
  });

  it('formats kilobytes', () => {
    expect(formatBytes(1024)).toBe('1.00 KB');
    expect(formatBytes(1536)).toBe('1.50 KB');
    expect(formatBytes(10 * 1024)).toBe('10.0 KB');
    expect(formatBytes(99 * 1024)).toBe('99.0 KB');
    expect(formatBytes(100 * 1024)).toBe('100 KB');
  });

  it('formats megabytes', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.00 MB');
    expect(formatBytes(5.5 * 1024 * 1024)).toBe('5.50 MB');
  });

  it('formats gigabytes', () => {
    expect(formatBytes(1024 ** 3)).toBe('1.00 GB');
    expect(formatBytes(2.5 * 1024 ** 3)).toBe('2.50 GB');
  });

  it('formats terabytes', () => {
    expect(formatBytes(1.5 * 1024 ** 4)).toBe('1.50 TB');
    expect(formatBytes(2 * 1024 ** 4)).toBe('2.00 TB');
  });

  it('returns em-dash for invalid input', () => {
    expect(formatBytes(NaN)).toBe('—');
    expect(formatBytes(-1)).toBe('—');
    expect(formatBytes(Infinity)).toBe('—');
    expect(formatBytes('100')).toBe('—');
    expect(formatBytes(null)).toBe('—');
    expect(formatBytes(undefined)).toBe('—');
  });
});

describe('formatPercent', () => {
  it('formats zero with no sign', () => {
    expect(formatPercent(0)).toBe('0%');
  });

  it('formats positive (savings) with the U+2212 minus by default', () => {
    expect(formatPercent(12.34)).toBe('−12%');
    expect(formatPercent(7.2)).toBe('−7.2%');
    expect(formatPercent(50)).toBe('−50%');
  });

  it('formats negative (got bigger) with a + by default', () => {
    expect(formatPercent(-4)).toBe('+4.0%');
    expect(formatPercent(-15)).toBe('+15%');
  });

  it('savingsSign:false uses ASCII +/-', () => {
    expect(formatPercent(12, {savingsSign: false})).toBe('+12%');
    expect(formatPercent(-3, {savingsSign: false})).toBe('-3.0%');
  });

  it('decimals override forces a fixed precision', () => {
    expect(formatPercent(12.345, {decimals: 2})).toBe('−12.35%');
    expect(formatPercent(0.5, {decimals: 0})).toBe('−1%');
  });

  it('returns empty string for non-finite input', () => {
    expect(formatPercent(NaN)).toBe('');
    expect(formatPercent(Infinity)).toBe('');
    expect(formatPercent('5')).toBe('');
  });
});
