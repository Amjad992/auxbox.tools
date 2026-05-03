import {describe, it, expect} from 'vitest';
import {formatBytes} from './format';

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
