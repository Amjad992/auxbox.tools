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

  // S15: dwBytesInRes and dwImageOffset assertions for 3-entry ICO.
  // Entries: 8 bytes, 16 bytes, 32 bytes.
  // Header = 6 + 16*3 = 54 bytes.
  // Offsets: entry0 = 54, entry1 = 54+8 = 62, entry2 = 62+16 = 78.
  it('records correct dwBytesInRes for each entry', async () => {
    const ico = await buildIcoFromPngBlobs([fakePng(16, 8), fakePng(32, 16), fakePng(48, 32)]);
    const buf = new Uint8Array(await ico.arrayBuffer());
    const dv = new DataView(buf.buffer);
    // dwBytesInRes is at entryOffset+8 (uint32, LE)
    expect(dv.getUint32(6 + 0 * 16 + 8, true)).toBe(8);
    expect(dv.getUint32(6 + 1 * 16 + 8, true)).toBe(16);
    expect(dv.getUint32(6 + 2 * 16 + 8, true)).toBe(32);
  });

  it('records correct dwImageOffset for each entry', async () => {
    const ico = await buildIcoFromPngBlobs([fakePng(16, 8), fakePng(32, 16), fakePng(48, 32)]);
    const buf = new Uint8Array(await ico.arrayBuffer());
    const dv = new DataView(buf.buffer);
    // dwImageOffset is at entryOffset+12 (uint32, LE)
    expect(dv.getUint32(6 + 0 * 16 + 12, true)).toBe(54); // 6 + 16*3 = 54
    expect(dv.getUint32(6 + 1 * 16 + 12, true)).toBe(62); // 54 + 8 = 62
    expect(dv.getUint32(6 + 2 * 16 + 12, true)).toBe(78); // 62 + 16 = 78
  });
});
