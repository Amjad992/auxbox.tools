import {
  CHARS,
  AMBIGUOUS,
  MIN_LENGTH,
  MAX_LENGTH,
  STRENGTH_BUCKETS,
} from './constants';

/**
 * Cryptographically uniform integer in [0, max). Uses rejection sampling
 * over a 32-bit range so the distribution stays uniform regardless of `max`.
 *
 * @param {number} max - Exclusive upper bound. Must be a positive integer.
 * @returns {number}
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

/**
 * Pick a uniformly-random character from a non-empty alphabet string.
 * @param {string} alphabet
 */
export function pickFromAlphabet(alphabet) {
  if (typeof alphabet !== 'string' || alphabet.length === 0) {
    throw new RangeError('pickFromAlphabet: alphabet must be non-empty');
  }
  return alphabet[secureRandomInt(alphabet.length)];
}

/**
 * Strip ambiguous characters from a pool string.
 * @param {string} pool
 */
export function stripAmbiguous(pool) {
  if (!pool) return '';
  const banned = new Set(AMBIGUOUS);
  let out = '';
  for (const ch of pool) if (!banned.has(ch)) out += ch;
  return out;
}

/**
 * Build the per-class alphabets and the combined pool for the given settings.
 * @param {{upper:boolean,lower:boolean,digits:boolean,symbols:boolean,excludeAmbiguous:boolean}} settings
 * @returns {{classes: string[], pool: string}}
 */
export function buildAlphabets(settings) {
  const classes = [];
  if (settings.upper) classes.push(CHARS.upper);
  if (settings.lower) classes.push(CHARS.lower);
  if (settings.digits) classes.push(CHARS.digits);
  if (settings.symbols) classes.push(CHARS.symbols);

  const filtered = settings.excludeAmbiguous
    ? classes.map(stripAmbiguous).filter((c) => c.length > 0)
    : classes;

  return {
    classes: filtered,
    pool: filtered.join(''),
  };
}

/**
 * Generate a cryptographically-random password.
 *
 * Guarantees one character from each selected (non-empty) class, then fills
 * the remaining length from the combined pool, then shuffles in place using
 * a Fisher–Yates shuffle driven by `secureRandomInt`.
 *
 * @param {{length:number,upper:boolean,lower:boolean,digits:boolean,symbols:boolean,excludeAmbiguous:boolean}} settings
 * @returns {string}
 */
export function generatePassword(settings) {
  if (!settings || typeof settings !== 'object') {
    throw new TypeError('generatePassword: settings object required');
  }

  const length = Number(settings.length);
  if (
    !Number.isInteger(length) ||
    length < MIN_LENGTH ||
    length > MAX_LENGTH
  ) {
    throw new RangeError(
      `generatePassword: length must be an integer in [${MIN_LENGTH}, ${MAX_LENGTH}]`
    );
  }

  const {classes, pool} = buildAlphabets(settings);
  if (classes.length === 0 || pool.length === 0) {
    throw new Error('generatePassword: at least one character class required');
  }
  if (classes.length > length) {
    // The "one of each class" guarantee can't be honored when we have more
    // selected classes than slots. The UI keeps this from happening
    // (length min is 6, max classes is 4) but guard anyway.
    throw new RangeError(
      'generatePassword: length must be >= number of selected character classes'
    );
  }

  const chars = new Array(length);

  // 1. One character from each selected class.
  for (let i = 0; i < classes.length; i++) {
    chars[i] = pickFromAlphabet(classes[i]);
  }

  // 2. Fill remaining slots from the combined pool.
  for (let i = classes.length; i < length; i++) {
    chars[i] = pickFromAlphabet(pool);
  }

  // 3. Fisher–Yates shuffle so the guaranteed slots aren't always at the front.
  for (let i = length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    const tmp = chars[i];
    chars[i] = chars[j];
    chars[j] = tmp;
  }

  return chars.join('');
}

/**
 * Shannon entropy in bits for a password drawn uniformly from `poolSize`
 * characters at the given `length`. Returns 0 if either input is invalid.
 * @param {number} length
 * @param {number} poolSize
 */
export function estimateEntropyBits(length, poolSize) {
  if (
    !Number.isFinite(length) ||
    !Number.isFinite(poolSize) ||
    length <= 0 ||
    poolSize <= 1
  ) {
    return 0;
  }
  return length * (Math.log(poolSize) / Math.log(2));
}

/**
 * Bucketize an entropy-bit count into a labeled strength tier.
 * @param {number} bits
 */
export function strengthBucket(bits) {
  const safe = Number.isFinite(bits) ? bits : 0;
  let match = STRENGTH_BUCKETS[0];
  for (const b of STRENGTH_BUCKETS) {
    if (safe >= b.minBits) match = b;
  }
  return match;
}
