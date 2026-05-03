import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
  deepEqual,
} from './storage';

describe('storage primitives', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('saveToLocalStorage', () => {
    it('saves a JSON envelope with version, timestamp, and data', () => {
      const ok = saveToLocalStorage('k', { a: 1 }, '1.0.0');
      expect(ok).toBe(true);

      const raw = window.localStorage.getItem('k');
      const parsed = JSON.parse(raw);
      expect(parsed.version).toBe('1.0.0');
      expect(parsed.data).toEqual({ a: 1 });
      expect(typeof parsed.timestamp).toBe('number');
    });

    it('rethrows when localStorage.setItem throws (quota etc.)', () => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = () => {
        throw new Error('QuotaExceeded');
      };
      try {
        expect(() => saveToLocalStorage('k', {}, '1')).toThrow('QuotaExceeded');
      } finally {
        Storage.prototype.setItem = original;
      }
    });
  });

  describe('loadFromLocalStorage', () => {
    it('returns null data when key is missing', () => {
      const r = loadFromLocalStorage('missing', '1.0.0');
      expect(r).toEqual({ data: null, wasCorrupted: false });
    });

    it('round-trips data when version matches', () => {
      saveToLocalStorage('k', { x: 42 }, '1.0.0');
      const r = loadFromLocalStorage('k', '1.0.0');
      expect(r.data).toEqual({ x: 42 });
      expect(r.wasCorrupted).toBe(false);
    });

    it('treats version mismatch as corruption and clears the key', () => {
      saveToLocalStorage('k', { x: 1 }, '1.0.0');
      const r = loadFromLocalStorage('k', '2.0.0');
      expect(r.data).toBeNull();
      expect(r.wasCorrupted).toBe(true);
      expect(window.localStorage.getItem('k')).toBeNull();
    });

    it('treats validator rejection as corruption and clears the key', () => {
      saveToLocalStorage('k', { x: 1 }, '1.0.0');
      const r = loadFromLocalStorage('k', '1.0.0', () => false);
      expect(r.data).toBeNull();
      expect(r.wasCorrupted).toBe(true);
      expect(window.localStorage.getItem('k')).toBeNull();
    });

    it('passes the validator and returns the data when it accepts', () => {
      saveToLocalStorage('k', { x: 1 }, '1.0.0');
      const validate = vi.fn().mockReturnValue(true);
      const r = loadFromLocalStorage('k', '1.0.0', validate);
      expect(validate).toHaveBeenCalledWith({ x: 1 });
      expect(r.data).toEqual({ x: 1 });
    });

    it('treats malformed JSON as corruption and clears the key', () => {
      window.localStorage.setItem('k', '{not json');
      const r = loadFromLocalStorage('k', '1.0.0');
      expect(r.data).toBeNull();
      expect(r.wasCorrupted).toBe(true);
      expect(window.localStorage.getItem('k')).toBeNull();
    });
  });

  describe('clearLocalStorage', () => {
    it('removes the stored key', () => {
      saveToLocalStorage('k', { x: 1 }, '1.0.0');
      clearLocalStorage('k');
      expect(window.localStorage.getItem('k')).toBeNull();
    });

    it('does not throw when underlying removeItem throws', () => {
      const spy = vi
        .spyOn(window.localStorage, 'removeItem')
        .mockImplementation(() => {
          throw new Error('boom');
        });
      expect(() => clearLocalStorage('k')).not.toThrow();
      spy.mockRestore();
    });
  });

  describe('deepEqual', () => {
    it('returns true for identical primitives', () => {
      expect(deepEqual(1, 1)).toBe(true);
      expect(deepEqual('a', 'a')).toBe(true);
      expect(deepEqual(null, null)).toBe(true);
    });

    it('returns false for null vs object', () => {
      expect(deepEqual(null, {})).toBe(false);
      expect(deepEqual({}, null)).toBe(false);
    });

    it('compares nested objects structurally', () => {
      expect(deepEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true);
      expect(deepEqual({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false);
    });

    it('detects extra keys on either side', () => {
      expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
      expect(deepEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false);
    });

    it('compares arrays by index', () => {
      expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
      expect(deepEqual([{ a: 1 }], [{ a: 1 }])).toBe(true);
    });
  });
});
