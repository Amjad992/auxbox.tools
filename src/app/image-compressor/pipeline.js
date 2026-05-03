import {
  DEFAULT_QUALITY,
  MIN_QUALITY,
  MAX_PIXELS,
  PNG_MIME,
  WEBP_MIME,
} from './constants';
import {
  computeTargetDimensions,
  mimeForFile,
  outputMimeFor,
} from './utils';

/**
 * Encode an image entirely in the browser using `<canvas>` + `canvas.toBlob`.
 *
 * Pure async function: takes a `File`/`Blob` + options, returns a result
 * object with the compressed `Blob` and final dimensions. No DOM mounting,
 * no React state. Designed so a Web Worker can adopt this later (the only
 * dependency on the main thread today is `document.createElement('canvas')`,
 * which a worker would replace with `OffscreenCanvas`).
 *
 * @param {File|Blob} file
 * @param {Object} options
 * @param {number} [options.quality]            0.1–1.0; ignored for PNG output
 * @param {number} [options.maxWidth]           pixels; blank/<=0 = unconstrained
 * @param {number} [options.maxHeight]          pixels; blank/<=0 = unconstrained
 * @param {boolean} [options.convertPngToWebp]  re-encode PNG inputs as WebP
 *
 * @returns {Promise<{ blob: Blob, width: number, height: number, mimeType: string }>}
 *
 * @throws {Error} when the input MIME is unsupported, or canvas.toBlob
 *   returns null (which a browser does when it can't encode the requested
 *   type — e.g., very old browsers and WebP).
 */
export async function compressImage(file, options = {}) {
  if (!file) throw new Error('No file provided');

  const inputMime = mimeForFile(file);
  const outMime = outputMimeFor(inputMime, options);
  if (!outMime) {
    throw new Error(`Unsupported image type: ${inputMime || 'unknown'}`);
  }

  const bitmap = await createImageBitmap(file);

  // MAJ-1: guard against huge decoded bitmaps that would OOM the tab.
  // The 25 MB input cap only bounds compressed bytes, not decoded pixels.
  if (bitmap.width * bitmap.height > MAX_PIXELS) {
    bitmap.close();
    throw new Error(
      `Image dimensions (${bitmap.width}×${bitmap.height}) exceed the safe limit ` +
        `(${Math.round(MAX_PIXELS / 1_000_000)} MP). Please resize the image first.`
    );
  }

  let width;
  let height;
  let canvas;
  try {
    const dims = computeTargetDimensions(
      bitmap.width,
      bitmap.height,
      options.maxWidth,
      options.maxHeight
    );
    width = dims.width;
    height = dims.height;

    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not acquire 2D rendering context');
    ctx.drawImage(bitmap, 0, 0, width, height);
  } finally {
    // Free the decoded bitmap as soon as it has been drawn.
    if (typeof bitmap.close === 'function') bitmap.close();
  }

  // PNG ignores the quality argument; pass undefined for clarity.
  const quality = outMime === PNG_MIME ? undefined : clampQuality(options.quality);

  const blob = await canvasToBlob(canvas, outMime, quality);
  if (!blob) {
    // MIN-2: surface an actionable message when toBlob returns null.
    // The most common case is WebP not being supported; for PNG inputs with the
    // "Convert PNG to WebP" toggle on, tell the user how to recover.
    const hint =
      outMime === WEBP_MIME && inputMime === PNG_MIME
        ? ' Try turning off the "Convert PNG to WebP" toggle.'
        : '';
    throw new Error(`Browser could not encode to ${outMime}.${hint}`);
  }

  return {blob, width, height, mimeType: outMime};
}

// MIN-7: use MIN_QUALITY as the floor so clampQuality matches the UI slider.
function clampQuality(q) {
  const num = Number(q);
  if (!Number.isFinite(num)) return DEFAULT_QUALITY;
  return Math.min(1, Math.max(MIN_QUALITY, num));
}

// MIN-9: wrap canvas.toBlob in try/catch so a synchronous throw (e.g. invalid
// type string in a strict browser) rejects the Promise instead of silently
// hanging and leaving the item in 'encoding' indefinitely.
function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => resolve(blob), type, quality);
    } catch (err) {
      reject(err);
    }
  });
}
