// Hash Generator — pure helpers.
//
// SHA-1 / SHA-256 / SHA-512 go through WebCrypto's `crypto.subtle.digest`,
// which is built into every modern browser. MD5 uses `spark-md5` because
// WebCrypto deliberately omits it (broken cryptographically; kept here
// only for legacy file-checksum verification, which is its main remaining
// use case).

import SparkMD5 from 'spark-md5';

const TEXT_ENCODER = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;

/** Convert an ArrayBuffer to lowercase hex. */
export function toHex(buffer) {
  const view = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < view.length; i++) {
    const byte = view[i];
    hex += byte < 16 ? `0${byte.toString(16)}` : byte.toString(16);
  }
  return hex;
}

/** Hash an ArrayBuffer using a single algorithm. Returns lowercase hex. */
export async function hashBufferWith(algo, buffer) {
  if (algo === 'MD5') {
    return md5OfBuffer(buffer);
  }
  if (typeof globalThis.crypto?.subtle?.digest !== 'function') {
    throw new Error('WebCrypto SubtleCrypto is not available in this environment.');
  }
  const digest = await globalThis.crypto.subtle.digest(algo, buffer);
  return toHex(digest);
}

/** Hash a UTF-8 string with all the requested algorithms in parallel. */
export async function hashText(text, algos) {
  if (!TEXT_ENCODER) {
    throw new Error('TextEncoder is not available in this environment.');
  }
  const buffer = TEXT_ENCODER.encode(text).buffer;
  return hashBuffer(buffer, algos);
}

/** Hash an ArrayBuffer with all the requested algorithms in parallel. */
export async function hashBuffer(buffer, algos) {
  const entries = await Promise.all(
    algos.map(async (algo) => [algo, await hashBufferWith(algo, buffer)])
  );
  return Object.fromEntries(entries);
}

/** Format a byte count for display (re-uses the formatBytes helper). */
export {formatBytes} from '../../lib/format';

// ─── helpers ──────────────────────────────────────────────────

function md5OfBuffer(buffer) {
  // spark-md5 has an ArrayBuffer-friendly API. For large files this
  // already streams internally; we just hand it the whole buffer.
  return SparkMD5.ArrayBuffer.hash(buffer);
}
