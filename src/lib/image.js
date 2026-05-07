/**
 * Shared image helpers — used by image-compressor and image-converter.
 *
 * Keep this file free of React / browser globals at import time.
 * Functions that touch `canvas` / `document` are async and only called
 * from event handlers, never at module-evaluation time.
 */

export const JPEG_MIME = 'image/jpeg';
export const PNG_MIME = 'image/png';
export const WEBP_MIME = 'image/webp';

export const SUPPORTED_INPUT_TYPES = Object.freeze([JPEG_MIME, PNG_MIME, WEBP_MIME]);
export const ACCEPT_ATTR = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';

/**
 * Hard decoded-pixel cap — 60 MP is safely above any reasonable photo while
 * still protecting against pathological inputs.  Both image tools use this
 * value so a single image is treated consistently regardless of which tool the
 * user opens.
 */
export const MAX_PIXELS = 60_000_000;

/**
 * Determine the effective input MIME type for a File. Some browsers leave
 * `file.type` blank; in that case fall back to the extension.
 *
 * @param {File|{type:string,name:string}|null|undefined} file
 * @returns {string}
 */
export function mimeForFile(file) {
  if (!file) return '';
  if (file.type) return file.type;
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return JPEG_MIME;
  if (name.endsWith('.png')) return PNG_MIME;
  if (name.endsWith('.webp')) return WEBP_MIME;
  return '';
}

/**
 * True when the file's resolved MIME is one of the three supported types.
 *
 * @param {File|{type:string,name:string}|null|undefined} file
 * @returns {boolean}
 */
export function isSupportedImage(file) {
  return SUPPORTED_INPUT_TYPES.includes(mimeForFile(file));
}

/**
 * Map a MIME type to a filename extension.
 *
 * @param {string} mime
 * @returns {string}  'jpg' | 'png' | 'webp' | 'bin'
 */
export function extensionForMime(mime) {
  switch (mime) {
    case JPEG_MIME:
      return 'jpg';
    case PNG_MIME:
      return 'png';
    case WEBP_MIME:
      return 'webp';
    default:
      return 'bin';
  }
}

/**
 * Savings percentage from `originalSize` → `outputSize`. Returns 0 when
 * input is invalid or original is zero. Negative savings (output bigger than
 * original) are returned as a negative percentage so the UI can flag them.
 *
 * @param {number} originalSize  bytes
 * @param {number} outputSize    bytes
 * @returns {number}
 */
export function savingsPct(originalSize, outputSize) {
  if (
    !Number.isFinite(originalSize) ||
    !Number.isFinite(outputSize) ||
    originalSize <= 0
  ) {
    return 0;
  }
  return ((originalSize - outputSize) / originalSize) * 100;
}

/**
 * Downsample and extract pixel data from an ImageBitmap into a flat RGBA
 * Uint8ClampedArray. Draws onto an off-screen canvas scaled by the square-
 * root-of-ratio so the total sample pixels ≤ maxSamplePixels.
 *
 * S8: throws if the 2D context cannot be acquired (e.g. GPU resource limits).
 *
 * @param {ImageBitmap} bitmap
 * @param {number}      maxSamplePixels  upper bound on pixels to sample
 * @returns {Uint8ClampedArray}
 */
export function extractPixels(bitmap, maxSamplePixels) {
  const totalPixels = bitmap.width * bitmap.height;
  const ratio = Math.min(1, Math.sqrt(maxSamplePixels / totalPixels));
  const w = Math.max(1, Math.round(bitmap.width * ratio));
  const h = Math.max(1, Math.round(bitmap.height * ratio));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not acquire 2D canvas context.');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'medium';
  ctx.drawImage(bitmap, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h).data;
}

/**
 * Wrap `canvas.toBlob` in a Promise that rejects when the browser cannot
 * encode the requested MIME (instead of resolving `null`).
 *
 * @param {HTMLCanvasElement} canvas
 * @param {string}            type     MIME type
 * @param {number|undefined}  quality  0.0–1.0; pass `undefined` for PNG
 * @returns {Promise<Blob>}
 */
export function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error(`Could not encode as ${type}.`));
        },
        type,
        quality
      );
    } catch (err) {
      reject(err);
    }
  });
}
