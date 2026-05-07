// Image Converter — pure encoder.
//
// Decode the input via `createImageBitmap`, paint to a `<canvas>`, encode
// at the requested MIME via `canvas.toBlob`. No DOM mounting, no React
// state. Everything stays on the user's device.

import {ERR_DECODE} from './constants';
import {
  canvasToBlob,
  isSupportedImage,
  JPEG_MIME,
  MAX_PIXELS,
  mimeForFile,
  PNG_MIME,
  WEBP_MIME,
} from '../../lib/image';

// Re-export helpers so existing tests and page.js can import from ./pipeline
// without touching their import paths.
export {isSupportedImage, mimeForFile};

/**
 * Convert an image to a different MIME.
 *
 * @param {File|Blob} file
 * @param {Object} options
 * @param {string} options.target  one of JPEG_MIME / PNG_MIME / WEBP_MIME
 * @param {number} [options.quality=0.9]  0.1..1.0 — ignored for PNG
 * @returns {Promise<{blob: Blob, mimeType: string, width: number, height: number}>}
 *
 * @throws {Error} on invalid target, decode failure, encode failure, or
 *   pixel-count overflow.
 */
export async function convertImage(file, options = {}) {
  if (!file) throw new Error('No file provided.');
  const target = options.target;
  if (!target || ![JPEG_MIME, PNG_MIME, WEBP_MIME].includes(target)) {
    throw new Error(`Invalid target format: ${target || 'unset'}`);
  }
  // S7: quality guard — floor at 0.1 to match the slider minimum.
  const quality =
    typeof options.quality === 'number' &&
    options.quality >= 0.1 &&
    options.quality <= 1
      ? options.quality
      : 0.9;

  let bitmap;
  try {
    // S11: pass imageOrientation so EXIF-rotated JPEGs decode correctly.
    bitmap = await createImageBitmap(file, {imageOrientation: 'from-image'});
  } catch {
    throw new Error(ERR_DECODE);
  }

  // S12: capture dimensions before close() so the error message is safe.
  const bw = bitmap.width;
  const bh = bitmap.height;
  if (bw * bh > MAX_PIXELS) {
    bitmap.close();
    throw new Error(
      `Image dimensions (${bw}×${bh}) exceed the safe limit (${Math.round(MAX_PIXELS / 1_000_000)} MP).`
    );
  }

  // S3: wrap the canvas/draw block in try/finally to guarantee bitmap.close()
  // even if ctx.fillRect or ctx.drawImage throws synchronously.
  const canvas = document.createElement('canvas');
  canvas.width = bw;
  canvas.height = bh;
  try {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get a 2D canvas context.');
    }
    // For JPEG/WebP from a transparent PNG, paint a white background to
    // avoid weird black fill in unsupported alpha cases. For PNG output,
    // preserve transparency.
    if (target !== PNG_MIME) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(bitmap, 0, 0);
  } finally {
    bitmap.close();
  }

  // S2: canvasToBlob rejects on null — no post-call null-check needed.
  const blob = await canvasToBlob(
    canvas,
    target,
    target === PNG_MIME ? undefined : quality
  );
  return {
    blob,
    mimeType: target,
    width: canvas.width,
    height: canvas.height,
  };
}
