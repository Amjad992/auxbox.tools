// Image Converter — pure encoder.
//
// Decode the input via `createImageBitmap`, paint to a `<canvas>`, encode
// at the requested MIME via `canvas.toBlob`. No DOM mounting, no React
// state. Everything stays on the user's device.

import {
  ERR_DECODE,
  ERR_ENCODE,
  JPEG_MIME,
  MAX_PIXELS,
  PNG_MIME,
  SUPPORTED_INPUT_TYPES,
  WEBP_MIME,
} from './constants';

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
  const quality =
    typeof options.quality === 'number' &&
    options.quality > 0 &&
    options.quality <= 1
      ? options.quality
      : 0.9;

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(ERR_DECODE);
  }

  if (bitmap.width * bitmap.height > MAX_PIXELS) {
    bitmap.close();
    throw new Error(
      `Image dimensions (${bitmap.width}×${bitmap.height}) exceed the safe limit (${Math.round(MAX_PIXELS / 1_000_000)} MP).`
    );
  }

  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
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
  bitmap.close();

  const blob = await canvasToBlob(
    canvas,
    target,
    target === PNG_MIME ? undefined : quality
  );
  if (!blob) {
    throw new Error(`${ERR_ENCODE} (${target})`);
  }
  return {
    blob,
    mimeType: target,
    width: canvas.width,
    height: canvas.height,
  };
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => resolve(blob), type, quality);
    } catch (err) {
      reject(err);
    }
  });
}

/** Resolve a File's MIME, falling back to extension. */
export function mimeForFile(file) {
  if (!file) return '';
  if (file.type) return file.type;
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return JPEG_MIME;
  if (name.endsWith('.png')) return PNG_MIME;
  if (name.endsWith('.webp')) return WEBP_MIME;
  return '';
}

/** Is this file's MIME one of the supported input types? */
export function isSupportedImage(file) {
  return SUPPORTED_INPUT_TYPES.includes(mimeForFile(file));
}
