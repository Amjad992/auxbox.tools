import {describe, it, expect} from 'vitest';
import {medianCut} from './quantize';

function rgba(r, g, b, a = 255) {
  return [r, g, b, a];
}

function pixelArray(...rgbaArrs) {
  const out = new Uint8ClampedArray(rgbaArrs.length * 4);
  rgbaArrs.forEach((p, i) => {
    out[i * 4] = p[0];
    out[i * 4 + 1] = p[1];
    out[i * 4 + 2] = p[2];
    out[i * 4 + 3] = p[3];
  });
  return out;
}

describe('medianCut', () => {
  it('returns a single average for count=1', () => {
    const pixels = pixelArray(rgba(0, 0, 0), rgba(255, 255, 255));
    const palette = medianCut(pixels, 1);
    expect(palette).toEqual([{r: 128, g: 128, b: 128}]);
  });

  it('separates two clearly distinct clusters', () => {
    const pixels = pixelArray(
      rgba(255, 0, 0),
      rgba(255, 0, 0),
      rgba(0, 0, 255),
      rgba(0, 0, 255)
    );
    const palette = medianCut(pixels, 2);
    expect(palette).toHaveLength(2);
    const reds = palette.filter((c) => c.r > c.b);
    const blues = palette.filter((c) => c.b > c.r);
    expect(reds).toHaveLength(1);
    expect(blues).toHaveLength(1);
  });

  it('skips fully transparent pixels', () => {
    const pixels = pixelArray(rgba(255, 0, 0, 0), rgba(0, 255, 0));
    const palette = medianCut(pixels, 1);
    expect(palette[0].g).toBe(255);
  });

  it('returns empty when every pixel is transparent', () => {
    const pixels = pixelArray(rgba(255, 0, 0, 0), rgba(0, 255, 0, 0));
    expect(medianCut(pixels, 4)).toEqual([]);
  });

  it('clamps count to bucket count when fewer unique colors exist', () => {
    const pixels = pixelArray(rgba(10, 10, 10), rgba(200, 200, 200));
    const palette = medianCut(pixels, 8);
    expect(palette.length).toBeLessThanOrEqual(2);
  });

  it('throws on non-RGBA input', () => {
    const buf = new Uint8ClampedArray([1, 2, 3]);
    expect(() => medianCut(buf, 2)).toThrow(/RGBA/);
  });

  it('orders palette by frequency descending', () => {
    // 6 red pixels + 1 blue pixel. Even with median-cut splitting on widest
    // range, the bigger bucket should land first.
    const pixels = pixelArray(
      rgba(255, 0, 0),
      rgba(255, 0, 0),
      rgba(255, 0, 0),
      rgba(255, 0, 0),
      rgba(255, 0, 0),
      rgba(255, 0, 0),
      rgba(0, 0, 255)
    );
    const palette = medianCut(pixels, 2);
    expect(palette[0].r).toBeGreaterThan(palette[0].b);
  });
});
