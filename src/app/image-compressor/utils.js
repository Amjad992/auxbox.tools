import {
  JPEG_MIME,
  PNG_MIME,
  SUPPORTED_INPUT_TYPES,
  WEBP_MIME,
} from './constants';

/**
 * Compute target dimensions preserving aspect ratio.
 *
 * If `maxW` / `maxH` are blank/null/undefined or non-positive, that axis is
 * unconstrained. If neither would shrink the source, returns the source
 * dimensions unchanged (no upscaling).
 *
 * Returns integer pixel dimensions (rounded down, min 1).
 */
export function computeTargetDimensions(srcW, srcH, maxW, maxH) {
  if (!Number.isFinite(srcW) || !Number.isFinite(srcH) || srcW <= 0 || srcH <= 0) {
    throw new RangeError('Source dimensions must be positive finite numbers');
  }

  const wLimit = Number.isFinite(maxW) && maxW > 0 ? maxW : Infinity;
  const hLimit = Number.isFinite(maxH) && maxH > 0 ? maxH : Infinity;

  // No constraints, or both larger than source: keep original.
  if (wLimit >= srcW && hLimit >= srcH) {
    return {width: srcW, height: srcH};
  }

  // Scale by the most-restrictive axis to preserve aspect ratio.
  const scale = Math.min(wLimit / srcW, hLimit / srcH);
  const width = Math.max(1, Math.floor(srcW * scale));
  const height = Math.max(1, Math.floor(srcH * scale));
  return {width, height};
}

/**
 * Savings percentage from `original` → `compressed`. Returns 0 when input is
 * invalid or original is zero. Negative savings (compressed bigger than
 * original) are returned as a negative percentage so the UI can flag them.
 */
export function savingsPct(originalBytes, compressedBytes) {
  if (
    !Number.isFinite(originalBytes) ||
    !Number.isFinite(compressedBytes) ||
    originalBytes <= 0
  ) {
    return 0;
  }
  return ((originalBytes - compressedBytes) / originalBytes) * 100;
}

/**
 * Determine the effective input MIME type for a File. Some browsers leave
 * `file.type` blank; in that case fall back to the extension.
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
 * Decide the output MIME for a given input + user options.
 *
 * - JPEG → JPEG (re-encode with quality)
 * - WebP → WebP (re-encode with quality)
 * - PNG  → PNG by default; WebP if `convertPngToWebp` is true
 *
 * Returns null if the input MIME is unsupported.
 */
export function outputMimeFor(inputMime, options = {}) {
  switch (inputMime) {
    case JPEG_MIME:
      return JPEG_MIME;
    case WEBP_MIME:
      return WEBP_MIME;
    case PNG_MIME:
      return options.convertPngToWebp ? WEBP_MIME : PNG_MIME;
    default:
      return null;
  }
}

/**
 * Map a MIME type to an extension for downloaded filenames.
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
 * Build a download filename: original basename + suffix + new extension.
 * `image.jpg` → `image-compressed.jpg`.
 */
export function buildOutputFilename(originalName, outputMime) {
  const base = (originalName || 'image').replace(/\.[^/.]+$/, '');
  return `${base}-compressed.${extensionForMime(outputMime)}`;
}

/**
 * True when the input MIME (or detected MIME) is in our supported set.
 */
export function isSupportedInput(mime) {
  return SUPPORTED_INPUT_TYPES.includes(mime);
}
