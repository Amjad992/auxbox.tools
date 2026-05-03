// Image Compressor — tool constants.

// Hard input cap: protect the tab from OOM on huge inputs.
// 25 MB per file is plenty for anything a user would reasonably want to
// compress in a browser, and well under typical mobile RAM headroom.
export const MAX_FILE_BYTES = 25 * 1024 * 1024;

// Hard decoded-pixel cap (MAJ-1): a small file with extreme pixel dimensions
// can still OOM the tab. 64 MP (~8000×8000) is well above any reasonable
// photo while still protecting against pathological inputs.
export const MAX_PIXELS = 64_000_000;

export const MIN_QUALITY = 0.1;
export const MAX_QUALITY = 1.0;
export const QUALITY_STEP = 0.05;
export const DEFAULT_QUALITY = 0.8;

// MIME types we accept as input. Anything else is rejected with a clear error.
export const SUPPORTED_INPUT_TYPES = Object.freeze([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

// Pretty labels for the rejection error message.
export const SUPPORTED_INPUT_LABELS = 'JPEG, PNG, WebP';

// Output MIME for "convert to WebP" toggle when the input is PNG.
export const WEBP_MIME = 'image/webp';
export const JPEG_MIME = 'image/jpeg';
export const PNG_MIME = 'image/png';
