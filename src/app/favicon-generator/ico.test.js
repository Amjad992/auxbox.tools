import {describe, it, expect, beforeAll} from 'vitest';
import {buildIcoFromPngBlobs} from './ico';

// jsdom's Blob doesn't always expose arrayBuffer(); patch it once.
beforeAll(() => {
  if (typeof Blob.prototype.arrayBuffer !== 'function') {
    Blob.prototype.arrayBuffer = function () {
      return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = () => reject(r.error);
        r.readAsArrayBuffer(this);
      });
    };
  }
});

function fakePng(size, bytes = 8) {
  const arr = new Uint8Array(bytes);
  arr[0] = 0x89;
  arr[1] = 0x50;
  arr[2] = 0x4e;
  arr[3] = 0x47;
  return {size, blob: new Blob([arr], {type: 'image/png'})};
}

describe('buildIcoFromPngBlobs', () => {
  it('builds a valid ICO header for three entries', async () => {
    const ico = await buildIcoFromPngBlobs([fakePng(16), fakePng(32), fakePng(48)]);
    const buf = new Uint8Array(await ico.arrayBuffer());
    const dv = new DataView(buf.buffer);
    expect(dv.getUint16(0, true)).toBe(0);
    expect(dv.getUint16(2, true)).toBe(1);
    expect(dv.getUint16(4, true)).toBe(3);
    // First entry: width/height bytes 16/16.
    expect(buf[6]).toBe(16);
    expect(buf[7]).toBe(16);
  });

  it('rejects entries larger than 256 px', async () => {
    await expect(buildIcoFromPngBlobs([fakePng(512)])).rejects.toThrow(/256/);
  });

  it('returns a Blob with the image/x-icon mime', async () => {
    const ico = await buildIcoFromPngBlobs([fakePng(16)]);
    expect(ico.type).toBe('image/x-icon');
  });
});
