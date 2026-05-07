import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {convertImage, isSupportedImage, mimeForFile} from './pipeline';
import {JPEG_MIME, PNG_MIME, WEBP_MIME, MAX_PIXELS} from '../../lib/image';

describe('mimeForFile', () => {
  it('uses file.type when present', () => {
    expect(mimeForFile({type: PNG_MIME, name: 'x.bin'})).toBe(PNG_MIME);
  });

  it('falls back to extension when type is empty', () => {
    expect(mimeForFile({type: '', name: 'photo.jpg'})).toBe(JPEG_MIME);
    expect(mimeForFile({type: '', name: 'photo.JPEG'})).toBe(JPEG_MIME);
    expect(mimeForFile({type: '', name: 'pic.PNG'})).toBe(PNG_MIME);
    expect(mimeForFile({type: '', name: 'shot.WEBP'})).toBe(WEBP_MIME);
    expect(mimeForFile({type: '', name: 'data.bin'})).toBe('');
  });

  it('returns empty for null/undefined', () => {
    expect(mimeForFile(null)).toBe('');
    expect(mimeForFile(undefined)).toBe('');
  });
});

describe('isSupportedImage', () => {
  it('accepts the three target formats', () => {
    expect(isSupportedImage({type: JPEG_MIME})).toBe(true);
    expect(isSupportedImage({type: PNG_MIME})).toBe(true);
    expect(isSupportedImage({type: WEBP_MIME})).toBe(true);
  });

  it('rejects other types', () => {
    expect(isSupportedImage({type: 'image/gif'})).toBe(false);
    expect(isSupportedImage({type: 'application/pdf'})).toBe(false);
    expect(isSupportedImage({type: ''})).toBe(false);
  });
});

// convertImage — pipeline tests.
// jsdom does not implement createImageBitmap or canvas; we stub everything.

describe('convertImage', () => {
  let origCreateImageBitmap;
  let origCreateElement;

  beforeEach(() => {
    origCreateImageBitmap = globalThis.createImageBitmap;
    origCreateElement = document.createElement.bind(document);
  });

  afterEach(() => {
    globalThis.createImageBitmap = origCreateImageBitmap;
    vi.restoreAllMocks();
  });

  function makeBitmap(width = 100, height = 100) {
    return {width, height, close: vi.fn()};
  }

  function makeCanvas(blob = new Blob(['data'], {type: JPEG_MIME}), ctxOverrides = {}) {
    const ctx = {
      fillStyle: '',
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      ...ctxOverrides,
    };
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ctx),
      toBlob: vi.fn((cb, _type, _quality) => cb(blob)),
      _ctx: ctx,
    };
    return canvas;
  }

  function stubCanvas(canvas) {
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'canvas') return canvas;
      return origCreateElement(tag);
    });
  }

  it('happy path — returns blob, mimeType, width, height', async () => {
    const bitmap = makeBitmap(200, 150);
    globalThis.createImageBitmap = vi.fn().mockResolvedValue(bitmap);
    const fakeBlob = new Blob(['data'], {type: JPEG_MIME});
    const canvas = makeCanvas(fakeBlob);
    stubCanvas(canvas);

    const file = new File(['data'], 'test.png', {type: PNG_MIME});
    const result = await convertImage(file, {target: JPEG_MIME, quality: 0.8});

    expect(result.blob).toBe(fakeBlob);
    expect(result.mimeType).toBe(JPEG_MIME);
    expect(result.width).toBe(200);
    expect(result.height).toBe(150);
    expect(bitmap.close).toHaveBeenCalledTimes(1);
  });

  it('pixel-cap — throws and closes bitmap when w*h > MAX_PIXELS', async () => {
    const bigBitmap = makeBitmap(9000, 9000); // 81M > 60M
    globalThis.createImageBitmap = vi.fn().mockResolvedValue(bigBitmap);

    const file = new File(['data'], 'huge.jpg', {type: JPEG_MIME});

    await expect(
      convertImage(file, {target: JPEG_MIME})
    ).rejects.toThrow(/dimensions.*exceed the safe limit/i);

    expect(bigBitmap.close).toHaveBeenCalledTimes(1);
  });

  it('decode failure — rejects with ERR_DECODE message', async () => {
    globalThis.createImageBitmap = vi.fn().mockRejectedValue(new Error('bad'));

    const file = new File(['data'], 'bad.jpg', {type: JPEG_MIME});
    await expect(
      convertImage(file, {target: JPEG_MIME})
    ).rejects.toThrow('Image could not be decoded.');
  });

  it('null blob from canvasToBlob — rejects with encode error', async () => {
    const bitmap = makeBitmap();
    globalThis.createImageBitmap = vi.fn().mockResolvedValue(bitmap);

    const canvas = makeCanvas(null); // toBlob returns null
    stubCanvas(canvas);

    const file = new File(['data'], 'test.jpg', {type: JPEG_MIME});
    await expect(
      convertImage(file, {target: JPEG_MIME})
    ).rejects.toThrow(/Could not encode as/);

    expect(bitmap.close).toHaveBeenCalledTimes(1);
  });

  it('white-fill — JPEG target sets fillStyle and calls fillRect', async () => {
    const bitmap = makeBitmap();
    globalThis.createImageBitmap = vi.fn().mockResolvedValue(bitmap);
    const fakeBlob = new Blob(['data'], {type: JPEG_MIME});
    const canvas = makeCanvas(fakeBlob);
    stubCanvas(canvas);

    const file = new File(['data'], 'test.png', {type: PNG_MIME});
    await convertImage(file, {target: JPEG_MIME, quality: 0.9});

    expect(canvas._ctx.fillRect).toHaveBeenCalledTimes(1);
    expect(canvas._ctx.fillStyle).toBe('#ffffff');
  });

  it('white-fill — PNG target does NOT call fillRect', async () => {
    const bitmap = makeBitmap();
    globalThis.createImageBitmap = vi.fn().mockResolvedValue(bitmap);
    const fakeBlob = new Blob(['data'], {type: PNG_MIME});
    const canvas = makeCanvas(fakeBlob);
    stubCanvas(canvas);

    const file = new File(['data'], 'test.jpg', {type: JPEG_MIME});
    await convertImage(file, {target: PNG_MIME});

    expect(canvas._ctx.fillRect).not.toHaveBeenCalled();
  });
});
