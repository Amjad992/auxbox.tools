// UUID Generator — pure helpers.
//
// v4 = random; uses `crypto.randomUUID()` natively when available
// (Node ≥ 18, all modern browsers), falls back to `crypto.getRandomValues`.
//
// v7 = unix-ms timestamp + random; per IETF draft (RFC 9562). Layout:
//   [48 bits ms timestamp][version=7 (4 bits)][rand_a (12 bits)]
//   [variant=10 (2 bits)][rand_b (62 bits)]
// Hand-rolled because the platform doesn't ship v7 yet.

import {TYPES} from './constants';

const HEX_PAIRS = Array.from({length: 256}, (_, i) =>
  i.toString(16).padStart(2, '0')
);

const V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const V7_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** UUID v4 — fully random. */
export function generateV4() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  // Fallback: pull 16 random bytes, set version + variant, hex-encode.
  const bytes = randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return formatBytes(bytes);
}

/** UUID v7 — unix-ms timestamp prefix + random tail. */
export function generateV7() {
  const ms = Date.now();
  const bytes = randomBytes(16);

  // Bytes 0-5: 48-bit big-endian timestamp.
  bytes[0] = (ms / 2 ** 40) & 0xff;
  bytes[1] = (ms / 2 ** 32) & 0xff;
  bytes[2] = (ms / 2 ** 24) & 0xff;
  bytes[3] = (ms / 2 ** 16) & 0xff;
  bytes[4] = (ms / 2 ** 8) & 0xff;
  bytes[5] = ms & 0xff;

  // Byte 6: version (high nibble = 7) + 4 random bits already there.
  bytes[6] = (bytes[6] & 0x0f) | 0x70;

  // Byte 8: variant (top 2 bits = 10) + 6 random bits.
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  return formatBytes(bytes);
}

/** Generate `count` UUIDs of the requested type. */
export function generateBatch(type, count) {
  const n = Math.max(0, Math.floor(Number(count) || 0));
  const out = new Array(n);
  const make = type === TYPES.V7 ? generateV7 : generateV4;
  for (let i = 0; i < n; i++) out[i] = make();
  return out;
}

/** Validate a UUID v4 or v7 string. */
export function isValidUuid(str) {
  return V4_REGEX.test(str) || V7_REGEX.test(str);
}

// ─── helpers ────────────────────────────────────────────────────

function randomBytes(n) {
  const buf = new Uint8Array(n);
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(buf);
    return buf;
  }
  // Final fallback (very old runtimes): Math.random() — not
  // cryptographically strong, but UUID v4/v7 collision probability is
  // dominated by the 122 random bits, not RNG quality.
  for (let i = 0; i < n; i++) buf[i] = Math.floor(Math.random() * 256);
  return buf;
}

function formatBytes(bytes) {
  // Format Uint8Array(16) as 8-4-4-4-12 hex.
  let s = '';
  for (let i = 0; i < bytes.length; i++) {
    s += HEX_PAIRS[bytes[i]];
    if (i === 3 || i === 5 || i === 7 || i === 9) s += '-';
  }
  return s;
}

// Re-export the validator regexes for test transparency.
export const _internal = {V4_REGEX, V7_REGEX};
