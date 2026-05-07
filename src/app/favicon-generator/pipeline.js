import {
  MAX_PIXELS,
  PNG_MIME,
  canvasToBlob,
  isSupportedImage,
} from '../../lib/image';
import {FAVICON_SIZES, ICO_SIZES} from './constants';
import {buildIcoFromPngBlobs} from './ico';

/**
 * Resize a source image to all standard favicon PNG sizes + (optionally) ICO.
 * Returns `{pngs: Array<{filename, size, blob}>, ico?: Blob}`.
 *
 * `background` controls how transparency is handled when the source is non-PNG
 * or when the user picks a solid backdrop:
 *   - 'transparent' — preserve alpha (PNG output is transparent).
 *   - 'white' / 'black' — fill the canvas before drawing.
 */
export async function generateFavicons(file, {background = 'transparent', includeIco = true} = {}) {
  if (!isSupportedImage(file)) {
    throw new Error('Unsupported image type. Use PNG, JPEG, or WebP.');
  }
  const bitmap = await createImageBitmap(file, {imageOrientation: 'from-image'});
  const bw = bitmap.width;
  const bh = bitmap.height;
  if (bw * bh > MAX_PIXELS) {
    bitmap.close?.();
    throw new Error(
      `Image is too large (${bw}×${bh} = ${(bw * bh / 1_000_000).toFixed(1)} MP). ` +
        `Maximum is ${Math.round(MAX_PIXELS / 1_000_000)} MP. Please resize first.`
    );
  }

  try {
    const pngs = [];
    for (const spec of FAVICON_SIZES) {
      const blob = await renderSquare(bitmap, spec.size, background);
      pngs.push({filename: spec.filename, size: spec.size, blob});
    }

    let ico = null;
    if (includeIco) {
      const icoSquares = [];
      for (const size of ICO_SIZES) {
        icoSquares.push({size, blob: await renderSquare(bitmap, size, background)});
      }
      ico = await buildIcoFromPngBlobs(icoSquares);
    }

    return {pngs, ico};
  } finally {
    bitmap.close?.();
  }
}

async function renderSquare(bitmap, size, background) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (background === 'white' || background === 'black') {
    ctx.fillStyle = background === 'white' ? '#ffffff' : '#000000';
    ctx.fillRect(0, 0, size, size);
  }
  // Cover-fit (preserve aspect): centre-crop the image into a square.
  const sw = bitmap.width;
  const sh = bitmap.height;
  const side = Math.min(sw, sh);
  const sx = (sw - side) / 2;
  const sy = (sh - side) / 2;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
  return canvasToBlob(canvas, PNG_MIME);
}
