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
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
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

/**
 * Human-readable percentage formatter.
 *
 * By default the sign is rendered with a minus glyph (U+2212) to match the
 * "savings" idiom used by Image Compressor (negative means "smaller"). Pass
 * `{savingsSign: false}` to use a regular `+`/`-` ASCII pair instead.
 *
 * Examples (defaults — savingsSign on):
 *   formatPercent(0)     → "0%"
 *   formatPercent(12.34) → "−12%"   // small reduction shown without decimal
 *   formatPercent(7.2)   → "−7.2%"  // <10 keeps one decimal
 *   formatPercent(-4)    → "+4.0%"  // file got bigger
 *
 * Returns '' for non-finite input.
 *
 * @param {number} pct
 * @param {{savingsSign?:boolean, decimals?:number|null}} [options]
 *   - savingsSign: when true (default), negative inputs render with `+`
 *     and positive inputs with the U+2212 minus.
 *   - decimals: when null (default), uses the auto rule: 1 decimal for
 *     |pct|<10, 0 decimals otherwise. Pass a number to force.
 */
export function formatPercent(pct, options = {}) {
  if (!Number.isFinite(pct)) return '';
  const {savingsSign = true, decimals = null} = options;
  if (pct === 0) return '0%';
  const abs = Math.abs(pct);
  const places = decimals != null ? decimals : abs >= 10 ? 0 : 1;
  const formatted = abs.toFixed(places);
  let sign;
  if (savingsSign) {
    sign = pct > 0 ? '−' : '+';
  } else {
    sign = pct > 0 ? '+' : '-';
  }
  return `${sign}${formatted}%`;
}

/**
 * Currency formatter built on top of `Intl.NumberFormat`.
 *
 * The currency is treated as a *label* — no FX conversion is performed.
 * Whole numbers are rendered without trailing zeros (`$1,000` not `$1,000.00`)
 * unless `options.alwaysDecimals` is true.
 *
 * Examples:
 *   formatCurrency(1234.5)             → "$1,234.50"
 *   formatCurrency(1000)               → "$1,000"
 *   formatCurrency(1000, 'EUR')        → "€1,000"
 *   formatCurrency(1234.5, 'EUR', {locale: 'it-IT'}) → "1.234,50 €"
 *   formatCurrency(0, 'GBP')           → "£0"
 *   formatCurrency(-50, 'USD')         → "-$50"
 *
 * Returns "—" for non-finite input.
 *
 * @param {number} value
 * @param {string} [currency='USD']  ISO 4217 code; passed straight to Intl.
 * @param {{locale?:string, alwaysDecimals?:boolean, maximumFractionDigits?:number}} [options]
 */
export function formatCurrency(value, currency = 'USD', options = {}) {
  if (!Number.isFinite(value)) return '—';
  const {
    locale = undefined,
    alwaysDecimals = false,
    maximumFractionDigits = 2,
  } = options;
  const isWhole = Number.isInteger(value);
  const minimumFractionDigits =
    alwaysDecimals || !isWhole ? Math.min(2, maximumFractionDigits) : 0;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
}
