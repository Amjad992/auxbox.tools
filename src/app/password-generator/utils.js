import {
  CHARS,
  AMBIGUOUS,
  MIN_LENGTH,
  MAX_LENGTH,
  STRENGTH_BUCKETS,
} from './constants';
import {secureRandomInt} from '../../lib/random';

// Re-export so existing consumers (and existing tests) can keep importing
// from this module unchanged. The implementation lives in src/lib/random.js.
export {secureRandomInt};

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
    ? classes.map(stripAmbiguous)
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
 * Entropy in bits for the actual generation algorithm, which forces one
 * character from each selected class before filling the remainder from the
 * combined pool.
 *
 * Formula: sum_i(log2(classSize_i))  +  (length - numClasses) * log2(poolSize)
 *   - The forced positions each contribute log2 of their class size.
 *   - The free positions each contribute log2 of the full pool size.
 *
 * Falls back to 0 for invalid inputs or when length < numClasses.
 *
 * @param {number} length     - Password length.
 * @param {number} poolSize   - Combined pool character count.
 * @param {number[]} [classSizes] - Per-class character counts. Defaults to
 *   treating the whole password as IID (backwards-compatible for callers that
 *   only pass the first two arguments).
 */
export function estimateEntropyBits(length, poolSize, classSizes = []) {
  if (
    !Number.isFinite(length) ||
    !Number.isFinite(poolSize) ||
    length <= 0 ||
    poolSize <= 1
  ) {
    return 0;
  }

  const numForced = classSizes.length;
  const freePositions = length - numForced;

  if (freePositions < 0) {
    // More forced slots than available positions — degenerate case.
    return 0;
  }

  // Sum of entropy from the forced (one-per-class) positions.
  const forcedBits = classSizes.reduce(
    (sum, size) => sum + (size > 1 ? Math.log2(size) : 0),
    0
  );

  // Entropy from the freely-chosen remaining positions.
  const freeBits = freePositions * Math.log2(poolSize);

  return forcedBits + freeBits;
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
