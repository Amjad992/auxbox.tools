import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {compressImage} from './pipeline';
import {MAX_PIXELS} from './constants';

// pipeline.js uses createImageBitmap / canvas — jsdom doesn't implement these.
// We stub everything at the global level to exercise the error paths.

describe('compressImage', () => {
  describe('MAJ-1: pixel cap', () => {
    it('throws and calls bitmap.close() when decoded pixels exceed MAX_PIXELS', async () => {
      const closeSpy = vi.fn();
      const bigBitmap = {
        width: 9000,
        height: 9000, // 81,000,000 > MAX_PIXELS (64,000,000)
        close: closeSpy,
      };

      const origCreateImageBitmap = globalThis.createImageBitmap;
      globalThis.createImageBitmap = vi.fn().mockResolvedValue(bigBitmap);

      const file = new File(['data'], 'huge.jpg', {type: 'image/jpeg'});

      await expect(compressImage(file, {})).rejects.toThrow(
        /dimensions.*exceed the safe limit/i
      );
      expect(closeSpy).toHaveBeenCalledTimes(1);

      globalThis.createImageBitmap = origCreateImageBitmap;
    });

    it('does not throw when decoded pixels are within MAX_PIXELS', async () => {
      // Use a bitmap exactly at the boundary (just under).
      const smallBitmap = {
        width: 8000,
        height: 7999, // 63,992,000 < 64,000,000
        close: vi.fn(),
      };

      const origCreateImageBitmap = globalThis.createImageBitmap;
      globalThis.createImageBitmap = vi.fn().mockResolvedValue(smallBitmap);

      // We don't have a real canvas in jsdom, so we expect a downstream error
      // (ctx === null) — NOT the pixel-cap error.
      const file = new File(['data'], 'ok.jpg', {type: 'image/jpeg'});

      await expect(compressImage(file, {})).rejects.not.toThrow(
        /dimensions.*exceed the safe limit/i
      );

      globalThis.createImageBitmap = origCreateImageBitmap;
    });

    it('MAX_PIXELS is exported from constants', () => {
      expect(typeof MAX_PIXELS).toBe('number');
      expect(MAX_PIXELS).toBe(64_000_000);
    });
  });

  describe('MIN-9: canvasToBlob synchronous throw', () => {
    it('rejects when canvas.toBlob throws synchronously', async () => {
      const bitmap = {
        width: 100,
        height: 100,
        close: vi.fn(),
      };

      const origCreateImageBitmap = globalThis.createImageBitmap;
      globalThis.createImageBitmap = vi.fn().mockResolvedValue(bitmap);

      // Stub document.createElement to return a canvas whose toBlob throws.
      const origCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tag) => {
        if (tag === 'canvas') {
          return {
            width: 0,
            height: 0,
            getContext: () => ({drawImage: vi.fn()}),
            toBlob: () => {
              throw new Error('toBlob synchronous error');
            },
          };
        }
        return origCreateElement(tag);
      });

      const file = new File(['data'], 'test.jpg', {type: 'image/jpeg'});

      await expect(compressImage(file, {})).rejects.toThrow(
        'toBlob synchronous error'
      );

      globalThis.createImageBitmap = origCreateImageBitmap;
      vi.restoreAllMocks();
    });
  });
});
