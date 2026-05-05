// Freelance Rate Calculator export/import helpers.
import {DateTime} from 'luxon';
import {validateFreelanceRateState} from './storageUtils';

const EXPORT_VERSION = '1.0.0';

/** Build the exportable config envelope around the live state. */
export function buildConfigPayload(state) {
  return {
    schema: 'auxbox.freelance-rate-calculator',
    version: EXPORT_VERSION,
    exportedAt: DateTime.now().toISO(),
    state,
  };
}

/** Trigger a browser download. Returns the URL it created so callers can
 * revoke if they hold a reference; we revoke immediately after click in
 * normal use because the download has already been fired. */
export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Defer revocation so Chromium doesn't cancel the still-pending download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return url;
}

/** Default file stem that includes today's date (YYYY-MM-DD). */
export function defaultConfigFilename(prefix = 'freelance-rate-config') {
  return `${prefix}-${DateTime.now().toISODate()}.json`;
}

/** Default CSV filename with date. */
export function defaultBreakdownFilename(prefix = 'freelance-rate-breakdown') {
  return `${prefix}-${DateTime.now().toISODate()}.csv`;
}

/**
 * Parse a JSON-config file's text and return either `{ok: true, state}` for
 * a recognised payload that survives schema validation, or `{ok: false, error}`
 * with a human-readable error message.
 */
export function parseConfigText(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return {ok: false, error: 'File is not valid JSON.'};
  }
  if (!parsed || typeof parsed !== 'object') {
    return {ok: false, error: 'Unexpected file shape — expected an object.'};
  }
  if (parsed.schema !== 'auxbox.freelance-rate-calculator') {
    return {
      ok: false,
      error:
        'This JSON does not look like a Freelance Rate Calculator config.',
    };
  }
  if (!validateFreelanceRateState(parsed.state)) {
    return {
      ok: false,
      error: 'Config schema validation failed — file may be from an older version.',
    };
  }
  return {ok: true, state: parsed.state};
}

/**
 * Build an Income-mode result CSV. Returns a UTF-8 string. Numbers are
 * raw — no currency symbol, so a spreadsheet can re-format. The currency
 * code is included as a header note for context.
 */
export function buildIncomeCsv({result, currency}) {
  const rows = [
    ['Auxbox — Freelance Rate Calculator — Income breakdown'],
    [`Currency: ${currency}`],
    [`Total billable hours: ${Math.round(result.totalBillableHours)}`],
    [],
    ['Horizon', 'Gross', 'Take-home (net)'],
    ['Hourly', round(result.hourly.gross), round(result.hourly.net)],
    ['Daily', round(result.daily.gross), round(result.daily.net)],
    ['Weekly', round(result.weekly.gross), round(result.weekly.net)],
    ['Monthly', round(result.monthly.gross), round(result.monthly.net)],
    ['Annual', round(result.annual.gross), round(result.annual.net)],
    [],
    ['Annual breakdown', 'Amount'],
    ['Operating costs', round(result.costsAnnual)],
    ['Platform fees', round(result.breakdown.platform)],
    ['Processor fees', round(result.breakdown.processor)],
    ['Other fees', round(result.breakdown.other)],
    ['Income tax', round(result.breakdown.income)],
    ['Take-home', round(result.annual.net)],
  ];
  return rows.map((r) => r.map(csvCell).join(',')).join('\n') + '\n';
}

function round(n) {
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function csvCell(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n]/.test(s)) {
    return `"${s.replaceAll('"', '""')}"`;
  }
  return s;
}
