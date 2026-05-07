// Hand-rolled ICO builder.
//
// ICO container with PNG-encoded entries (supported by every browser since
// IE11). We avoid bringing in a separate `png-to-ico` dependency for the
// 50-line container format.
//
// Layout:
//   ICONDIR (6 bytes): reserved=0, type=1, count=N
//   ICONDIRENTRY × N (16 bytes each): width, height, palette, reserved,
//     planes, bpp, sizeBytes, offset
//   PNG payloads concatenated
//
// `width=0` / `height=0` in the entry indicate ≥256 px; we stay ≤48 so we
// always write the actual size byte.

export async function buildIcoFromPngBlobs(entries) {
  const buffers = [];
  for (const e of entries) {
    if (e.size > 256) {
      throw new Error(`ICO entries must be ≤ 256 px (got ${e.size}).`);
    }
    buffers.push({size: e.size, bytes: new Uint8Array(await e.blob.arrayBuffer())});
  }

  const headerSize = 6 + 16 * buffers.length;
  const totalPayload = buffers.reduce((acc, b) => acc + b.bytes.byteLength, 0);
  const out = new Uint8Array(headerSize + totalPayload);
  const dv = new DataView(out.buffer);

  // ICONDIR.
  dv.setUint16(0, 0, true); // reserved
  dv.setUint16(2, 1, true); // type=1 (ICO)
  dv.setUint16(4, buffers.length, true);

  let offset = headerSize;
  for (let i = 0; i < buffers.length; i++) {
    const e = buffers[i];
    const entryOffset = 6 + i * 16;
    const sizeByte = e.size === 256 ? 0 : e.size;
    out[entryOffset] = sizeByte; // width
    out[entryOffset + 1] = sizeByte; // height
    out[entryOffset + 2] = 0; // palette colours (0 = none)
    out[entryOffset + 3] = 0; // reserved
    // PNG payload: planes=1, bpp=32 — preserved by Windows Explorer / browsers.
    dv.setUint16(entryOffset + 4, 1, true); // colour planes
    dv.setUint16(entryOffset + 6, 32, true); // bits per pixel
    dv.setUint32(entryOffset + 8, e.bytes.byteLength, true);
    dv.setUint32(entryOffset + 12, offset, true);
    out.set(e.bytes, offset);
    offset += e.bytes.byteLength;
  }

  return new Blob([out], {type: 'image/x-icon'});
}
