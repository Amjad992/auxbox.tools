// Median-cut color quantizer.
//
// Classic algorithm: start with one bucket containing every pixel, repeatedly
// split the bucket with the widest channel range at the median value along
// that channel until we have `count` buckets, then average each.
//
// We avoid pulling in a quantizer library (rgbquant / colorthief) because the
// hot loop is ~80 lines of straightforward math.

/**
 * Quantize an RGBA pixel array to `count` representative colors.
 *
 * @param {Uint8ClampedArray|Uint8Array} pixels — flat RGBA array (length % 4 === 0)
 * @param {number} count — desired palette size, ≥ 1
 * @returns {Array<{r:number,g:number,b:number}>} palette sorted by frequency desc
 */
export function medianCut(pixels, count) {
  if (count < 1) throw new Error('count must be ≥ 1');
  if (pixels.length % 4 !== 0) throw new Error('pixels must be RGBA');

  const rgb = [];
  for (let i = 0; i < pixels.length; i += 4) {
    // Skip mostly-transparent pixels — they're not part of the visible image.
    if (pixels[i + 3] < 128) continue;
    rgb.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
  }
  if (rgb.length === 0) return [];
  if (count === 1 || rgb.length === 1) {
    return [averageBucket(rgb)];
  }

  let buckets = [rgb];
  while (buckets.length < count) {
    const idx = pickWidestBucket(buckets);
    if (idx === -1) break; // all buckets are single-pixel — can't split further
    const [a, b] = splitBucket(buckets[idx]);
    buckets.splice(idx, 1, a, b);
  }

  return buckets
    .map((bucket) => ({...averageBucket(bucket), weight: bucket.length}))
    .sort((x, y) => y.weight - x.weight)
    .map(({r, g, b}) => ({r, g, b}));
}

function pickWidestBucket(buckets) {
  let bestIdx = -1;
  let bestRange = -1;
  for (let i = 0; i < buckets.length; i++) {
    if (buckets[i].length < 2) continue;
    const range = bucketRange(buckets[i]);
    if (range.range > bestRange) {
      bestRange = range.range;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function bucketRange(bucket) {
  let rMin = 255,
    gMin = 255,
    bMin = 255;
  let rMax = 0,
    gMax = 0,
    bMax = 0;
  for (const [r, g, b] of bucket) {
    if (r < rMin) rMin = r;
    if (r > rMax) rMax = r;
    if (g < gMin) gMin = g;
    if (g > gMax) gMax = g;
    if (b < bMin) bMin = b;
    if (b > bMax) bMax = b;
  }
  const dr = rMax - rMin;
  const dg = gMax - gMin;
  const db = bMax - bMin;
  let channel = 0;
  let range = dr;
  if (dg > range) {
    channel = 1;
    range = dg;
  }
  if (db > range) {
    channel = 2;
    range = db;
  }
  return {channel, range};
}

function splitBucket(bucket) {
  const {channel} = bucketRange(bucket);
  bucket.sort((p, q) => p[channel] - q[channel]);
  const mid = bucket.length >> 1;
  return [bucket.slice(0, mid), bucket.slice(mid)];
}

function averageBucket(bucket) {
  let r = 0,
    g = 0,
    b = 0;
  for (const p of bucket) {
    r += p[0];
    g += p[1];
    b += p[2];
  }
  const n = bucket.length;
  return {
    r: Math.round(r / n),
    g: Math.round(g / n),
    b: Math.round(b / n),
  };
}

/**
 * Downsample-and-extract pixels from a bitmap-like into a Uint8ClampedArray.
 * Caller passes in the canvas helpers (so this stays jsdom-friendly).
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
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'medium';
  ctx.drawImage(bitmap, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h).data;
}
