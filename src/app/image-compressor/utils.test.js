import {describe, it, expect} from 'vitest';
import {
  computeTargetDimensions,
  savingsPct,
  mimeForFile,
  outputMimeFor,
  extensionForMime,
  buildOutputFilename,
  isSupportedInput,
} from './utils';
import {JPEG_MIME, PNG_MIME, WEBP_MIME} from './constants';

describe('computeTargetDimensions', () => {
  it('returns source dimensions unchanged when no constraints', () => {
    expect(computeTargetDimensions(800, 600, null, null)).toEqual({
      width: 800,
      height: 600,
    });
  });

  it('returns source dimensions unchanged when constraints exceed source (no upscale)', () => {
    expect(computeTargetDimensions(800, 600, 2000, 2000)).toEqual({
      width: 800,
      height: 600,
    });
  });

  it('downscales to fit max-width while preserving aspect ratio', () => {
    expect(computeTargetDimensions(2000, 1000, 1000, null)).toEqual({
      width: 1000,
      height: 500,
    });
  });

  it('downscales to fit max-height while preserving aspect ratio', () => {
    expect(computeTargetDimensions(1000, 2000, null, 1000)).toEqual({
      width: 500,
      height: 1000,
    });
  });

  it('uses the most-restrictive axis when both max-width and max-height set', () => {
    // Source 4000x2000, maxW=1000 (scale 0.25), maxH=800 (scale 0.4)
    // Most restrictive: 0.25 → 1000x500.
    expect(computeTargetDimensions(4000, 2000, 1000, 800)).toEqual({
      width: 1000,
      height: 500,
    });
  });

  it('treats blank / non-positive constraints as unconstrained', () => {
    expect(computeTargetDimensions(800, 600, 0, undefined)).toEqual({
      width: 800,
      height: 600,
    });
    expect(computeTargetDimensions(800, 600, -100, NaN)).toEqual({
      width: 800,
      height: 600,
    });
  });

  it('floors to integer pixels and never returns less than 1', () => {
    const result = computeTargetDimensions(10, 10, 1, 1);
    expect(result.width).toBe(1);
    expect(result.height).toBe(1);
    expect(Number.isInteger(result.width)).toBe(true);
    expect(Number.isInteger(result.height)).toBe(true);
  });

  it('throws on invalid source dimensions', () => {
    expect(() => computeTargetDimensions(0, 100, 50, 50)).toThrow(RangeError);
    expect(() => computeTargetDimensions(100, -1, 50, 50)).toThrow(RangeError);
    expect(() => computeTargetDimensions(NaN, 100, 50, 50)).toThrow(RangeError);
  });
});

describe('savingsPct', () => {
  it('returns 0 for invalid input', () => {
    expect(savingsPct(0, 100)).toBe(0);
    expect(savingsPct(NaN, 100)).toBe(0);
    expect(savingsPct(100, NaN)).toBe(0);
  });

  it('returns positive percentage when compressed is smaller', () => {
    expect(savingsPct(1000, 250)).toBe(75);
    expect(savingsPct(1000, 500)).toBe(50);
  });

  it('returns 0 when sizes are equal', () => {
    expect(savingsPct(1000, 1000)).toBe(0);
  });

  it('returns negative percentage when compressed is larger', () => {
    expect(savingsPct(1000, 1500)).toBe(-50);
  });
});

describe('mimeForFile', () => {
  it('returns file.type when present', () => {
    expect(mimeForFile({type: 'image/jpeg', name: 'foo.jpg'})).toBe(
      'image/jpeg'
    );
  });

  it('falls back to extension for jpeg/jpg', () => {
    expect(mimeForFile({type: '', name: 'foo.JPG'})).toBe(JPEG_MIME);
    expect(mimeForFile({type: '', name: 'foo.jpeg'})).toBe(JPEG_MIME);
  });

  it('falls back to extension for png', () => {
    expect(mimeForFile({type: '', name: 'foo.PNG'})).toBe(PNG_MIME);
  });

  it('falls back to extension for webp', () => {
    expect(mimeForFile({type: '', name: 'foo.webp'})).toBe(WEBP_MIME);
  });

  it('returns empty string for unknown extension and missing type', () => {
    expect(mimeForFile({type: '', name: 'foo.gif'})).toBe('');
  });

  it('returns empty string for null/undefined input', () => {
    expect(mimeForFile(null)).toBe('');
    expect(mimeForFile(undefined)).toBe('');
  });
});

describe('outputMimeFor', () => {
  it('keeps JPEG as JPEG', () => {
    expect(outputMimeFor(JPEG_MIME)).toBe(JPEG_MIME);
  });

  it('keeps WebP as WebP', () => {
    expect(outputMimeFor(WEBP_MIME)).toBe(WEBP_MIME);
  });

  it('keeps PNG as PNG by default (lossless)', () => {
    expect(outputMimeFor(PNG_MIME)).toBe(PNG_MIME);
    expect(outputMimeFor(PNG_MIME, {convertPngToWebp: false})).toBe(PNG_MIME);
  });

  it('converts PNG to WebP when toggle is set', () => {
    expect(outputMimeFor(PNG_MIME, {convertPngToWebp: true})).toBe(WEBP_MIME);
  });

  it('returns null for unsupported types (gif/avif/heic/svg)', () => {
    expect(outputMimeFor('image/gif')).toBeNull();
    expect(outputMimeFor('image/avif')).toBeNull();
    expect(outputMimeFor('image/heic')).toBeNull();
    expect(outputMimeFor('image/svg+xml')).toBeNull();
    expect(outputMimeFor('')).toBeNull();
  });
});

describe('extensionForMime', () => {
  it('maps known mimes', () => {
    expect(extensionForMime(JPEG_MIME)).toBe('jpg');
    expect(extensionForMime(PNG_MIME)).toBe('png');
    expect(extensionForMime(WEBP_MIME)).toBe('webp');
  });

  it('returns bin for unknown mimes', () => {
    expect(extensionForMime('image/gif')).toBe('bin');
  });
});

describe('buildOutputFilename', () => {
  it('replaces the extension and appends -compressed', () => {
    expect(buildOutputFilename('photo.jpg', JPEG_MIME)).toBe(
      'photo-compressed.jpg'
    );
    expect(buildOutputFilename('photo.png', WEBP_MIME)).toBe(
      'photo-compressed.webp'
    );
  });

  it('handles names without an extension', () => {
    expect(buildOutputFilename('photo', JPEG_MIME)).toBe(
      'photo-compressed.jpg'
    );
  });

  it('preserves dots inside the basename', () => {
    expect(buildOutputFilename('my.cool.photo.png', PNG_MIME)).toBe(
      'my.cool.photo-compressed.png'
    );
  });

  it('falls back to "image" when name is empty', () => {
    expect(buildOutputFilename('', JPEG_MIME)).toBe('image-compressed.jpg');
    expect(buildOutputFilename(undefined, JPEG_MIME)).toBe(
      'image-compressed.jpg'
    );
  });
});

describe('isSupportedInput', () => {
  it('accepts jpeg/png/webp', () => {
    expect(isSupportedInput(JPEG_MIME)).toBe(true);
    expect(isSupportedInput(PNG_MIME)).toBe(true);
    expect(isSupportedInput(WEBP_MIME)).toBe(true);
  });

  it('rejects everything else', () => {
    expect(isSupportedInput('image/gif')).toBe(false);
    expect(isSupportedInput('image/avif')).toBe(false);
    expect(isSupportedInput('image/heic')).toBe(false);
    expect(isSupportedInput('image/svg+xml')).toBe(false);
    expect(isSupportedInput('')).toBe(false);
  });
});
