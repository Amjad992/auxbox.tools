import {secureRandomInt} from '../../lib/random';
import {
  PALETTE_SATURATION,
  PALETTE_LIGHTNESS,
  QUICK_PICK_DECEL_POWER,
} from './constants';

/**
 * Parse the raw textarea text into a clean entry list:
 *   - split on newlines
 *   - trim each line
 *   - drop empty lines
 *   - dedupe (case-sensitive, first occurrence wins)
 *
 * @param {string} text
 * @returns {string[]}
 */
export function parseEntries(text) {
  if (typeof text !== 'string' || text.length === 0) return [];
  const seen = new Set();
  const out = [];
  for (const raw of text.split(/\r?\n/)) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

/**
 * Pick a uniformly-random index in [0, n). Wraps `secureRandomInt` so the
 * caller doesn't need to import it directly.
 * @param {number} n
 */
export function pickWinnerIndex(n) {
  return secureRandomInt(n);
}

/**
 * Remove the entry at the given index, returning a new array.
 * If the index is out of range, the original array is returned unchanged.
 * @param {string[]} entries
 * @param {number} index
 */
export function removeEntryAt(entries, index) {
  if (!Array.isArray(entries)) return [];
  if (!Number.isInteger(index) || index < 0 || index >= entries.length) {
    return entries.slice();
  }
  return entries.slice(0, index).concat(entries.slice(index + 1));
}

/**
 * Build the highlight schedule for the Quick Pick mode.
 *
 * Returns an array of `{index, delay}` items, where `index` is the entry to
 * highlight and `delay` is the gap (ms) BEFORE that step fires (relative to
 * the previous step). The very last step is the winner.
 *
 * Guarantees:
 *  - last step's index === winnerIndex
 *  - sum of `delay` values === totalMs (within rounding)
 *  - delays are monotonically non-decreasing (deceleration)
 *
 * @param {number} n         entry count (>= 2)
 * @param {number} winnerIndex precomputed winner
 * @param {number} totalMs    target duration (~1500)
 * @param {number} steps      number of highlights (default tuned in constants)
 */
export function quickPickSchedule(n, winnerIndex, totalMs, steps) {
  if (!Number.isInteger(n) || n < 2) {
    throw new RangeError('quickPickSchedule: n must be an integer >= 2');
  }
  if (
    !Number.isInteger(winnerIndex) ||
    winnerIndex < 0 ||
    winnerIndex >= n
  ) {
    throw new RangeError('quickPickSchedule: winnerIndex out of range');
  }
  if (!Number.isFinite(totalMs) || totalMs <= 0) {
    throw new RangeError('quickPickSchedule: totalMs must be > 0');
  }
  const stepCount = Number.isInteger(steps) && steps >= 2 ? steps : 32;

  // 1. Raw weights using a power easing — later steps weigh much more.
  // weight(k) = (k+1)^p where k in [0..stepCount-1] gives a decelerating cadence
  // when used as gaps (the last gap is the largest).
  const weights = [];
  let weightSum = 0;
  for (let k = 0; k < stepCount; k++) {
    const w = Math.pow(k + 1, QUICK_PICK_DECEL_POWER);
    weights.push(w);
    weightSum += w;
  }

  // 2. Normalize to the requested total, rounding while preserving the sum.
  const delays = new Array(stepCount);
  let used = 0;
  for (let k = 0; k < stepCount - 1; k++) {
    const d = Math.max(1, Math.round((weights[k] / weightSum) * totalMs));
    delays[k] = d;
    used += d;
  }
  delays[stepCount - 1] = Math.max(1, totalMs - used);

  // 3. Build the indices. Cycle through entries pseudo-randomly but
  // deterministically based on step number; the final index is forced to
  // the winner, and we make sure the second-last step is NOT the winner so
  // there's a visible "snap" onto the result.
  const indices = new Array(stepCount);
  for (let k = 0; k < stepCount - 1; k++) {
    indices[k] = (k * 7 + 3) % n; // simple traversal — deterministic, varied
  }
  indices[stepCount - 1] = winnerIndex;

  // Guard: avoid the same index twice in a row at the end so the winner
  // visually pops on the snap.
  if (n > 1 && stepCount >= 2 && indices[stepCount - 2] === winnerIndex) {
    indices[stepCount - 2] = (winnerIndex + 1) % n;
  }

  return indices.map((index, k) => ({index, delay: delays[k]}));
}

// ─── Wheel geometry ──────────────────────────────────────────────────────
//
// Convention:
//   - Pointer is fixed at the top (12 o'clock = 0°).
//   - Slice i (0..n-1) is initially centered at angle  (i + 0.5) * (360 / n)
//     measured CLOCKWISE from the pointer.
//   - The wheel rotates CLOCKWISE; positive rotation R rotates each slice by
//     R degrees clockwise.
//   - Slice i lands under the pointer when its centre is at 0° after rotation,
//     i.e. when R ≡ -((i + 0.5) * 360/n) (mod 360).
//
// `targetRotationFor` and `winnerFromRotation` are exact inverses.

/**
 * Compute the absolute rotation (in degrees) that lands slice `index` under
 * the pointer, with `extraSpins` full extra rotations baked in.
 *
 * @param {number} index
 * @param {number} n
 * @param {number} [extraSpins=5]
 * @returns {number}
 */
export function targetRotationFor(index, n, extraSpins = 5) {
  if (!Number.isInteger(n) || n < 2) {
    throw new RangeError('targetRotationFor: n must be an integer >= 2');
  }
  if (!Number.isInteger(index) || index < 0 || index >= n) {
    throw new RangeError('targetRotationFor: index out of range');
  }
  const slice = 360 / n;
  const centerOf = (index + 0.5) * slice; // clockwise from top
  // R such that (centerOf + R) mod 360 === 0
  const baseR = (360 - (centerOf % 360)) % 360;
  return extraSpins * 360 + baseR;
}

/**
 * Inverse of `targetRotationFor` — for any rotation, return the slice
 * currently sitting under the pointer.
 *
 * @param {number} rotation
 * @param {number} n
 * @returns {number} index in [0, n)
 */
export function winnerFromRotation(rotation, n) {
  if (!Number.isInteger(n) || n < 2) {
    throw new RangeError('winnerFromRotation: n must be an integer >= 2');
  }
  if (!Number.isFinite(rotation)) {
    throw new RangeError('winnerFromRotation: rotation must be finite');
  }
  const slice = 360 / n;
  // Effective rotation modulo 360 (always in [0, 360)).
  const eff = ((rotation % 360) + 360) % 360;
  // The slice now sitting under the pointer was originally at angle
  //   originAngle = (360 - eff) mod 360
  // measured clockwise from the pointer (since the wheel turned by `eff`
  // clockwise, the slice that's now at 0° came from -eff = 360-eff).
  const originAngle = (360 - eff) % 360;
  // Slice i covers [i*slice, (i+1)*slice) measured clockwise from top.
  // Use a tiny epsilon so a rotation that exactly hits the boundary doesn't
  // float-round into the previous slice.
  const idx = Math.floor((originAngle + 1e-9) / slice) % n;
  return idx;
}

/**
 * Deterministic HSL palette — same list always produces the same colours.
 * Hue is stepped by 360/n.
 * @param {number} n
 * @returns {string[]}
 */
export function buildPalette(n) {
  if (!Number.isInteger(n) || n < 1) return [];
  const step = 360 / n;
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    const hue = Math.round(i * step) % 360;
    out[i] = `hsl(${hue}, ${PALETTE_SATURATION}%, ${PALETTE_LIGHTNESS}%)`;
  }
  return out;
}

/**
 * Build the SVG path `d` for a pie slice of the unit circle (radius `r`,
 * centred at (cx, cy)) spanning the angular range [startDeg, endDeg],
 * measured CLOCKWISE from the top (12 o'clock).
 *
 * @param {number} cx
 * @param {number} cy
 * @param {number} r
 * @param {number} startDeg
 * @param {number} endDeg
 * @returns {string}
 */
export function slicePath(cx, cy, r, startDeg, endDeg) {
  // SVG's coordinate system has y-down; "clockwise from top" maps to
  // angle measured from -90° (12 o'clock) increasing clockwise.
  const toXY = (deg) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const span = endDeg - startDeg;
  // Full-circle special case (n === 1): SVG arcs of exactly 360° collapse,
  // so render two 180° arcs back to back.
  if (span >= 360 - 1e-6) {
    const [sx, sy] = toXY(startDeg);
    const [mx, my] = toXY(startDeg + 180);
    return `M ${sx} ${sy} A ${r} ${r} 0 1 1 ${mx} ${my} A ${r} ${r} 0 1 1 ${sx} ${sy} Z`;
  }
  const [sx, sy] = toXY(startDeg);
  const [ex, ey] = toXY(endDeg);
  const largeArc = span > 180 ? 1 : 0;
  // sweep-flag = 1 (clockwise) since our angle increases clockwise.
  return `M ${cx} ${cy} L ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey} Z`;
}
