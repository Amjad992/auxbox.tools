import {
  DEFAULT_QUALITY,
  PNG_MIME,
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
    throw new Error(`Browser could not encode to ${outMime}`);
  }

  return {blob, width, height, mimeType: outMime};
}

function clampQuality(q) {
  const num = Number(q);
  if (!Number.isFinite(num)) return DEFAULT_QUALITY;
  if (num < 0.01) return 0.01;
  if (num > 1) return 1;
  return num;
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      type,
      quality
    );
  });
}
