import {describe, it, expect, vi} from 'vitest';
import {
  JPEG_MIME,
  PNG_MIME,
  WEBP_MIME,
  SUPPORTED_INPUT_TYPES,
  MAX_PIXELS,
  mimeForFile,
  isSupportedImage,
  extensionForMime,
  savingsPct,
  canvasToBlob,
} from './image';

describe('constants', () => {
  it('MAX_PIXELS is 60_000_000', () => {
    expect(MAX_PIXELS).toBe(60_000_000);
  });

  it('SUPPORTED_INPUT_TYPES contains the three MIMEs', () => {
    expect(SUPPORTED_INPUT_TYPES).toContain(JPEG_MIME);
    expect(SUPPORTED_INPUT_TYPES).toContain(PNG_MIME);
    expect(SUPPORTED_INPUT_TYPES).toContain(WEBP_MIME);
    expect(SUPPORTED_INPUT_TYPES).toHaveLength(3);
  });
});

describe('mimeForFile', () => {
  it('returns file.type when present', () => {
    expect(mimeForFile({type: PNG_MIME, name: 'x.bin'})).toBe(PNG_MIME);
  });

  it('falls back to .jpg / .jpeg extension', () => {
    expect(mimeForFile({type: '', name: 'photo.jpg'})).toBe(JPEG_MIME);
    expect(mimeForFile({type: '', name: 'photo.JPEG'})).toBe(JPEG_MIME);
  });

  it('falls back to .png extension', () => {
    expect(mimeForFile({type: '', name: 'pic.PNG'})).toBe(PNG_MIME);
  });

  it('falls back to .webp extension', () => {
    expect(mimeForFile({type: '', name: 'shot.webp'})).toBe(WEBP_MIME);
  });

  it('returns empty for unknown extension', () => {
    expect(mimeForFile({type: '', name: 'data.bin'})).toBe('');
  });

  it('returns empty for null / undefined', () => {
    expect(mimeForFile(null)).toBe('');
    expect(mimeForFile(undefined)).toBe('');
  });
});

describe('isSupportedImage', () => {
  it('accepts the three supported types', () => {
    expect(isSupportedImage({type: JPEG_MIME})).toBe(true);
    expect(isSupportedImage({type: PNG_MIME})).toBe(true);
    expect(isSupportedImage({type: WEBP_MIME})).toBe(true);
  });

  it('rejects other types', () => {
    expect(isSupportedImage({type: 'image/gif'})).toBe(false);
    expect(isSupportedImage({type: 'application/pdf'})).toBe(false);
    expect(isSupportedImage({type: ''})).toBe(false);
    expect(isSupportedImage(null)).toBe(false);
  });
});

describe('extensionForMime', () => {
  it('maps known MIMEs to extensions', () => {
    expect(extensionForMime(JPEG_MIME)).toBe('jpg');
    expect(extensionForMime(PNG_MIME)).toBe('png');
    expect(extensionForMime(WEBP_MIME)).toBe('webp');
  });

  it('returns bin for unknown MIMEs', () => {
    expect(extensionForMime('image/gif')).toBe('bin');
    expect(extensionForMime('')).toBe('bin');
  });
});

describe('savingsPct', () => {
  it('returns 0 for invalid / zero original', () => {
    expect(savingsPct(0, 100)).toBe(0);
    expect(savingsPct(NaN, 100)).toBe(0);
    expect(savingsPct(100, NaN)).toBe(0);
  });

  it('returns positive percentage when output is smaller', () => {
    expect(savingsPct(1000, 250)).toBe(75);
    expect(savingsPct(1000, 500)).toBe(50);
  });

  it('returns 0 when sizes are equal', () => {
    expect(savingsPct(1000, 1000)).toBe(0);
  });

  it('returns negative percentage when output is larger', () => {
    expect(savingsPct(1000, 1500)).toBe(-50);
  });
});

describe('canvasToBlob', () => {
  it('resolves with the blob when toBlob succeeds', async () => {
    const fakeBlob = new Blob(['x'], {type: JPEG_MIME});
    const canvas = {
      toBlob: vi.fn((cb) => cb(fakeBlob)),
    };
    const blob = await canvasToBlob(canvas, JPEG_MIME, 0.9);
    expect(blob).toBe(fakeBlob);
  });

  it('rejects when toBlob returns null', async () => {
    const canvas = {
      toBlob: vi.fn((cb) => cb(null)),
    };
    await expect(canvasToBlob(canvas, JPEG_MIME, 0.9)).rejects.toThrow(
      /Could not encode as/
    );
  });

  it('rejects when toBlob throws synchronously', async () => {
    const canvas = {
      toBlob: () => {
        throw new Error('sync error');
      },
    };
    await expect(canvasToBlob(canvas, JPEG_MIME, 0.9)).rejects.toThrow('sync error');
  });
});
