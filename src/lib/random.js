/**
 * Cryptographically uniform integer in [0, max). Uses rejection sampling
 * over a 32-bit range so the distribution stays uniform regardless of `max`.
 *
 * Lifted from src/app/password-generator/utils.js (2026-05-04) so any tool
 * needing a fair index (password generator, wheel spinner, future random
 * pickers) shares one tested implementation.
 *
 * @param {number} max - Exclusive upper bound. Must be a positive integer.
 * @returns {number}
 * @throws {RangeError} If `max` is not a positive integer.
 * @throws {Error} If `crypto.getRandomValues` is unavailable.
 */
export function secureRandomInt(max) {
  if (!Number.isInteger(max) || max <= 0) {
    throw new RangeError('secureRandomInt: max must be a positive integer');
  }
  const cryptoObj =
    typeof globalThis !== 'undefined' && globalThis.crypto
      ? globalThis.crypto
      : null;
  if (!cryptoObj || typeof cryptoObj.getRandomValues !== 'function') {
    throw new Error('secureRandomInt: crypto.getRandomValues unavailable');
  }
  // Largest multiple of `max` that fits in a uint32 — values >= this are
  // rejected to avoid modulo bias.
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const buf = new Uint32Array(1);
  while (true) {
    cryptoObj.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % max;
  }
}
