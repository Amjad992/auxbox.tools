import {describe, it, expect} from 'vitest';
import {isSupportedImage, mimeForFile} from './pipeline';
import {JPEG_MIME, PNG_MIME, WEBP_MIME} from './constants';

describe('mimeForFile', () => {
  it('uses file.type when present', () => {
    expect(mimeForFile({type: PNG_MIME, name: 'x.bin'})).toBe(PNG_MIME);
  });

  it('falls back to extension when type is empty', () => {
    expect(mimeForFile({type: '', name: 'photo.jpg'})).toBe(JPEG_MIME);
    expect(mimeForFile({type: '', name: 'photo.JPEG'})).toBe(JPEG_MIME);
    expect(mimeForFile({type: '', name: 'pic.PNG'})).toBe(PNG_MIME);
    expect(mimeForFile({type: '', name: 'shot.WEBP'})).toBe(WEBP_MIME);
    expect(mimeForFile({type: '', name: 'data.bin'})).toBe('');
  });

  it('returns empty for null/undefined', () => {
    expect(mimeForFile(null)).toBe('');
    expect(mimeForFile(undefined)).toBe('');
  });
});

describe('isSupportedImage', () => {
  it('accepts the three target formats', () => {
    expect(isSupportedImage({type: JPEG_MIME})).toBe(true);
    expect(isSupportedImage({type: PNG_MIME})).toBe(true);
    expect(isSupportedImage({type: WEBP_MIME})).toBe(true);
  });

  it('rejects other types', () => {
    expect(isSupportedImage({type: 'image/gif'})).toBe(false);
    expect(isSupportedImage({type: 'application/pdf'})).toBe(false);
    expect(isSupportedImage({type: ''})).toBe(false);
  });
});
