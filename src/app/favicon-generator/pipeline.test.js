import {describe, it, expect, vi, beforeAll} from 'vitest';
import {generateFavicons} from './pipeline';
import {FAVICON_SIZES, ICO_SIZES} from './constants';
import {MAX_PIXELS} from '../../lib/image';

beforeAll(() => {
  if (typeof Blob.prototype.arrayBuffer !== 'function') {
    Blob.prototype.arrayBuffer = function () {
      return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = () => reject(r.error);
        r.readAsArrayBuffer(this);
      });
    };
  }
});

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

function pngBlob() {
  return new Blob([PNG_BYTES], {type: 'image/png'});
}

function stubCanvas() {
  // Each createElement('canvas') call returns its own fake canvas.
  const orig = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tag) => {
    if (tag !== 'canvas') return orig(tag);
    const ctx = {
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      fillStyle: '',
      imageSmoothingEnabled: false,
      imageSmoothingQuality: '',
    };
    return {
      width: 0,
      height: 0,
      getContext: () => ctx,
      toBlob: (cb) => cb(pngBlob()),
    };
  });
}

describe('generateFavicons', () => {
  it('rejects unsupported file types', async () => {
    const file = new File(['x'], 'foo.txt', {type: 'text/plain'});
    await expect(generateFavicons(file)).rejects.toThrow(/unsupported/i);
  });

  it('rejects images that exceed MAX_PIXELS', async () => {
    const closeSpy = vi.fn();
    const orig = globalThis.createImageBitmap;
    globalThis.createImageBitmap = vi.fn().mockResolvedValue({
      width: 9000,
      height: 9000,
      close: closeSpy,
    });
    const file = new File(['x'], 'big.png', {type: 'image/png'});
    await expect(generateFavicons(file)).rejects.toThrow(/too large/i);
    expect(closeSpy).toHaveBeenCalled();
    expect(MAX_PIXELS).toBeGreaterThan(0);
    globalThis.createImageBitmap = orig;
  });

  it('produces one PNG per FAVICON_SIZES entry', async () => {
    const closeSpy = vi.fn();
    const orig = globalThis.createImageBitmap;
    globalThis.createImageBitmap = vi.fn().mockResolvedValue({
      width: 1024,
      height: 1024,
      close: closeSpy,
    });
    stubCanvas();
    const file = new File(['x'], 'logo.png', {type: 'image/png'});
    const out = await generateFavicons(file, {includeIco: false});
    expect(out.pngs).toHaveLength(FAVICON_SIZES.length);
    expect(out.ico).toBeNull();
    expect(closeSpy).toHaveBeenCalled();
    globalThis.createImageBitmap = orig;
    vi.restoreAllMocks();
  });

  it('produces an ICO containing ICO_SIZES entries', async () => {
    const orig = globalThis.createImageBitmap;
    globalThis.createImageBitmap = vi.fn().mockResolvedValue({
      width: 1024,
      height: 1024,
      close: vi.fn(),
    });
    stubCanvas();
    const file = new File(['x'], 'logo.png', {type: 'image/png'});
    const out = await generateFavicons(file, {includeIco: true});
    expect(out.ico).toBeInstanceOf(Blob);
    expect(out.ico.type).toBe('image/x-icon');
    const buf = new Uint8Array(await out.ico.arrayBuffer());
    const dv = new DataView(buf.buffer);
    expect(dv.getUint16(4, true)).toBe(ICO_SIZES.length);
    globalThis.createImageBitmap = orig;
    vi.restoreAllMocks();
  });

  // S14: cover-fit centre-crop math
  it('centre-crops a landscape 1000×500 source correctly', async () => {
    const orig = globalThis.createImageBitmap;
    let capturedCtx;
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag !== 'canvas') return origCreate(tag);
      const ctx = {
        fillRect: vi.fn(),
        drawImage: vi.fn(),
        fillStyle: '',
        imageSmoothingEnabled: false,
        imageSmoothingQuality: '',
      };
      capturedCtx = ctx;
      return {
        width: 0,
        height: 0,
        getContext: () => ctx,
        toBlob: (cb) => cb(new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], {type: 'image/png'})),
      };
    });

    globalThis.createImageBitmap = vi.fn().mockResolvedValue({
      width: 1000,
      height: 500,
      close: vi.fn(),
    });
    const file = new File(['x'], 'landscape.png', {type: 'image/png'});
    await generateFavicons(file, {includeIco: false, background: 'transparent'});
    // For 1000×500: side = min(1000,500) = 500, sx = (1000-500)/2 = 250, sy = 0
    expect(capturedCtx.drawImage).toHaveBeenCalledWith(
      expect.anything(), // bitmap
      250, 0, 500, 500,  // sx, sy, sWidth, sHeight
      0, 0,              // dx, dy
      expect.any(Number), expect.any(Number) // dWidth, dHeight
    );
    globalThis.createImageBitmap = orig;
    vi.restoreAllMocks();
  });

  // S14: background fill paths
  it('calls fillRect for white background', async () => {
    const orig = globalThis.createImageBitmap;
    let capturedCtx;
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag !== 'canvas') return origCreate(tag);
      const ctx = {
        fillRect: vi.fn(),
        drawImage: vi.fn(),
        fillStyle: '',
        imageSmoothingEnabled: false,
        imageSmoothingQuality: '',
      };
      capturedCtx = ctx;
      return {
        width: 0,
        height: 0,
        getContext: () => ctx,
        toBlob: (cb) => cb(new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], {type: 'image/png'})),
      };
    });

    globalThis.createImageBitmap = vi.fn().mockResolvedValue({
      width: 512,
      height: 512,
      close: vi.fn(),
    });
    const file = new File(['x'], 'logo.png', {type: 'image/png'});
    await generateFavicons(file, {includeIco: false, background: 'white'});
    expect(capturedCtx.fillRect).toHaveBeenCalled();
    globalThis.createImageBitmap = orig;
    vi.restoreAllMocks();
  });

  it('does NOT call fillRect for transparent background', async () => {
    const orig = globalThis.createImageBitmap;
    let capturedCtx;
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag !== 'canvas') return origCreate(tag);
      const ctx = {
        fillRect: vi.fn(),
        drawImage: vi.fn(),
        fillStyle: '',
        imageSmoothingEnabled: false,
        imageSmoothingQuality: '',
      };
      capturedCtx = ctx;
      return {
        width: 0,
        height: 0,
        getContext: () => ctx,
        toBlob: (cb) => cb(new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], {type: 'image/png'})),
      };
    });

    globalThis.createImageBitmap = vi.fn().mockResolvedValue({
      width: 512,
      height: 512,
      close: vi.fn(),
    });
    const file = new File(['x'], 'logo.png', {type: 'image/png'});
    await generateFavicons(file, {includeIco: false, background: 'transparent'});
    expect(capturedCtx.fillRect).not.toHaveBeenCalled();
    globalThis.createImageBitmap = orig;
    vi.restoreAllMocks();
  });
});
