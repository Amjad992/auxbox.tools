// Image Converter constants.

export const STORAGE_VERSION = '1.0.0';
export const STORAGE_KEY = 'image_converter_state';
export const STATE_AUTOSAVE_DEBOUNCE_MS = 300;

export const JPEG_MIME = 'image/jpeg';
export const PNG_MIME = 'image/png';
export const WEBP_MIME = 'image/webp';

export const TARGET_OPTIONS = [
  {value: PNG_MIME, label: 'PNG', extension: 'png'},
  {value: JPEG_MIME, label: 'JPEG', extension: 'jpg'},
  {value: WEBP_MIME, label: 'WebP', extension: 'webp'},
];
export const TARGET_VALUES = TARGET_OPTIONS.map((t) => t.value);

export const SUPPORTED_INPUT_TYPES = [JPEG_MIME, PNG_MIME, WEBP_MIME];
export const ACCEPT_ATTR = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';

export const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB (matches image-compressor)
export const MAX_PIXELS = 60_000_000; // ~60 MP

export const ERR_NOT_IMAGE =
  'Unsupported image type. Use JPEG, PNG, or WebP.';
export const ERR_TOO_LARGE = 'Image too large.';
export const ERR_DECODE = 'Image could not be decoded.';
export const ERR_ENCODE = 'Image could not be encoded in the requested format.';

export const DEFAULT_QUALITY = 0.9;

export const DEFAULT_STATE = {
  target: PNG_MIME,
  quality: DEFAULT_QUALITY,
};
