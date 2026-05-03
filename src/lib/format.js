/**
 * Shared formatting helpers used by multiple tools.
 */

/**
 * Human-readable byte formatter using binary (1024) units.
 *
 * Examples:
 *   formatBytes(0)        → "0 B"
 *   formatBytes(500)      → "500 B"
 *   formatBytes(1024)     → "1.00 KB"
 *   formatBytes(1536)     → "1.50 KB"
 *   formatBytes(102400)   → "100 KB"
 *   formatBytes(5e6)      → "4.77 MB"
 *
 * Returns "—" for invalid input (NaN, negative).
 */
export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  // Bytes: integer; KB+: 2 decimals < 10, 1 decimal < 100, 0 decimals >= 100.
  const decimals = i === 0 ? 0 : n < 10 ? 2 : n < 100 ? 1 : 0;
  return `${n.toFixed(decimals)} ${units[i]}`;
}
