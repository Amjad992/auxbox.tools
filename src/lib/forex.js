/**
 * forex.js — Pure API helpers for the Exchange Rates tool.
 *
 * No React, no DOM, no side effects outside of `fetch` calls.
 *
 * Providers (in fallback order):
 *   1. fawazahmed0 via jsDelivr CDN
 *   2. fawazahmed0 via Cloudflare (currency-api.pages.dev)
 *   3. open.er-api.com (latest only — no historical on the free tier)
 */

import {DateTime} from 'luxon';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const JSDELIVR_BASE = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api';
const CLOUDFLARE_BASE = 'https://currency-api.pages.dev';
const OPEN_ER_BASE = 'https://open.er-api.com/v6';

// ---------------------------------------------------------------------------
// Module-scope currency-list cache
// ---------------------------------------------------------------------------

let _currencyListCache = null;

/** Reset the module-scope currency-list cache. Only for tests. */
export function _resetCurrencyCache() {
  _currencyListCache = null;
}

// ---------------------------------------------------------------------------
// URL builders
// ---------------------------------------------------------------------------

/**
 * Build a fawazahmed0 rates URL.
 *
 * @param {'jsdelivr'|'cloudflare'} host
 * @param {string} base  — uppercase ISO code, e.g. 'USD'
 * @param {string} tag   — 'latest' or 'YYYY-MM-DD'
 * @returns {string}
 */
export function buildFawazRatesUrl(host, base, tag) {
  const origin = host === 'jsdelivr' ? JSDELIVR_BASE : CLOUDFLARE_BASE;
  const path = `/v1/currencies/${base.toLowerCase()}.min.json`;
  if (host === 'jsdelivr') {
    return `${origin}@${tag}${path}`;
  }
  return `${origin}/${tag}${path}`;
}

/**
 * Build a fawazahmed0 currency-list URL.
 *
 * @param {'jsdelivr'|'cloudflare'} host
 * @returns {string}
 */
export function buildFawazListUrl(host) {
  const origin = host === 'jsdelivr' ? JSDELIVR_BASE : CLOUDFLARE_BASE;
  if (host === 'jsdelivr') {
    return `${origin}@latest/v1/currencies.min.json`;
  }
  return `${origin}/latest/v1/currencies.min.json`;
}

/**
 * Build an open.er-api.com rates URL.
 *
 * @param {string} base — uppercase ISO code
 * @returns {string}
 */
export function buildOpenErUrl(base) {
  return `${OPEN_ER_BASE}/latest/${base.toUpperCase()}`;
}

// ---------------------------------------------------------------------------
// Normalizers
// ---------------------------------------------------------------------------

/**
 * Normalize a fawazahmed0 response to {rates, source, date}.
 *
 * fawazahmed0 returns: `{date: "YYYY-MM-DD", <base_lowercase>: {<target>: rate, ...}}`
 * where keys are lowercase ISO codes.
 *
 * @param {object} json
 * @param {string} base — uppercase ISO code of the base currency
 * @returns {{rates: Record<string,number>, source: string, date: string}}
 */
export function normalizeFawaz(json, base) {
  const rateMap = json[base.toLowerCase()];
  if (!rateMap || typeof rateMap !== 'object') {
    throw new Error(`fawazahmed0: no rate map for base "${base}"`);
  }
  const rates = {};
  for (const [k, v] of Object.entries(rateMap)) {
    rates[k.toUpperCase()] = v;
  }
  return {
    rates,
    source: 'fawazahmed0',
    date: json.date ?? '',
  };
}

/**
 * Normalize an open.er-api.com response to {rates, source, date}.
 *
 * open.er-api returns: `{result:"success", rates:{USD:1,...}, time_last_update_utc:"..."}`
 * where rates keys are already uppercase.
 *
 * @param {object} json
 * @returns {{rates: Record<string,number>, source: string, date: string}}
 */
export function normalizeOpenEr(json) {
  if (json.result !== 'success') {
    throw new Error(`open.er-api: result = "${json.result}"`);
  }
  // open.er-api returns an RFC-2822-like string that Luxon doesn't parse directly.
  // Use JS Date as a boundary converter (only at third-party data ingress).
  const date = json.time_last_update_utc
    ? DateTime.fromJSDate(new Date(json.time_last_update_utc)).toISODate() ?? ''
    : '';
  return {
    rates: json.rates ?? {},
    source: 'open-er-api',
    date,
  };
}

// ---------------------------------------------------------------------------
// Core fetch helpers
// ---------------------------------------------------------------------------

async function fetchJson(url, signal) {
  const res = await fetch(url, {signal});
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch exchange rates for `base` on `dateOrLatest`.
 *
 * Falls back:
 *   fawazahmed0/jsDelivr → fawazahmed0/Cloudflare → open.er-api (latest only)
 *
 * @param {string} base             — uppercase ISO code, e.g. 'USD'
 * @param {string} [dateOrLatest]   — 'latest' or 'YYYY-MM-DD' (default: 'latest')
 * @param {AbortSignal} [signal]    — optional AbortSignal
 * @returns {Promise<{rates: Record<string,number>, source: string, date: string}>}
 */
export async function fetchRates(base, dateOrLatest = 'latest', signal) {
  const tag = dateOrLatest === 'latest' ? 'latest' : dateOrLatest;
  const isLatest = dateOrLatest === 'latest';

  // Provider 1: fawazahmed0 via jsDelivr
  try {
    const url = buildFawazRatesUrl('jsdelivr', base, tag);
    const json = await fetchJson(url, signal);
    return normalizeFawaz(json, base);
  } catch (err) {
    if (signal?.aborted) throw err;
    // fall through
  }

  // Provider 2: fawazahmed0 via Cloudflare
  try {
    const url = buildFawazRatesUrl('cloudflare', base, tag);
    const json = await fetchJson(url, signal);
    return normalizeFawaz(json, base);
  } catch (err) {
    if (signal?.aborted) throw err;
    // fall through
  }

  // Provider 3: open.er-api (latest only)
  if (isLatest) {
    const url = buildOpenErUrl(base);
    const json = await fetchJson(url, signal);
    return normalizeOpenEr(json);
  }

  throw new Error(
    `All rate providers failed for base="${base}" date="${dateOrLatest}"`
  );
}

/**
 * Fetch the full currency list from fawazahmed0.
 * Returns [{code: 'USD', name: 'United States Dollar'}, ...].
 * Results are cached in module scope after the first successful fetch.
 *
 * @param {AbortSignal} [signal]
 * @returns {Promise<Array<{code: string, name: string}>>}
 */
export async function fetchCurrencyList(signal) {
  if (_currencyListCache) return _currencyListCache;

  let json;
  try {
    json = await fetchJson(buildFawazListUrl('jsdelivr'), signal);
  } catch (err) {
    if (signal?.aborted) throw err;
    json = await fetchJson(buildFawazListUrl('cloudflare'), signal);
  }

  // The response is {<code>: <name>, ...} — lowercase codes.
  const list = Object.entries(json).map(([code, name]) => ({
    code: code.toUpperCase(),
    name: typeof name === 'string' ? name : code.toUpperCase(),
  }));

  // Sort alphabetically by code.
  list.sort((a, b) => a.code.localeCompare(b.code));

  _currencyListCache = list;
  return list;
}
