import {describe, it, expect, beforeEach, vi} from 'vitest';
import {
  buildFawazRatesUrl,
  buildFawazListUrl,
  buildOpenErUrl,
  normalizeFawaz,
  normalizeOpenEr,
  fetchRates,
  fetchCurrencyList,
  _resetCurrencyCache,
} from './forex';

// ---------------------------------------------------------------------------
// URL builders
// ---------------------------------------------------------------------------

describe('buildFawazRatesUrl', () => {
  it('builds jsDelivr latest URL', () => {
    const url = buildFawazRatesUrl('jsdelivr', 'USD', 'latest');
    expect(url).toBe(
      'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json'
    );
  });

  it('builds jsDelivr historical URL with lowercase base', () => {
    const url = buildFawazRatesUrl('jsdelivr', 'PKR', '2024-01-15');
    expect(url).toBe(
      'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@2024-01-15/v1/currencies/pkr.min.json'
    );
  });

  it('builds Cloudflare latest URL', () => {
    const url = buildFawazRatesUrl('cloudflare', 'EUR', 'latest');
    expect(url).toBe(
      'https://currency-api.pages.dev/latest/v1/currencies/eur.min.json'
    );
  });
});

describe('buildFawazListUrl', () => {
  it('builds jsDelivr list URL', () => {
    expect(buildFawazListUrl('jsdelivr')).toBe(
      'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.min.json'
    );
  });

  it('builds Cloudflare list URL', () => {
    expect(buildFawazListUrl('cloudflare')).toBe(
      'https://currency-api.pages.dev/latest/v1/currencies.min.json'
    );
  });
});

describe('buildOpenErUrl', () => {
  it('builds open.er-api URL uppercasing the base', () => {
    expect(buildOpenErUrl('usd')).toBe(
      'https://open.er-api.com/v6/latest/USD'
    );
  });
});

// ---------------------------------------------------------------------------
// Normalizers
// ---------------------------------------------------------------------------

describe('normalizeFawaz', () => {
  it('normalizes lowercase fawazahmed0 response to uppercase keys', () => {
    const json = {
      date: '2024-05-08',
      usd: {eur: 0.92, pkr: 279.6, gbp: 0.79},
    };
    const result = normalizeFawaz(json, 'USD');
    expect(result.source).toBe('fawazahmed0');
    expect(result.date).toBe('2024-05-08');
    expect(result.rates.EUR).toBe(0.92);
    expect(result.rates.PKR).toBe(279.6);
    expect(result.rates.GBP).toBe(0.79);
    // Lowercase key must NOT be present
    expect(result.rates.eur).toBeUndefined();
  });

  it('throws if no rate map for base', () => {
    expect(() => normalizeFawaz({date: '2024-05-08', eur: {}}, 'USD')).toThrow();
  });
});

describe('normalizeOpenEr', () => {
  it('normalizes open.er-api response', () => {
    const json = {
      result: 'success',
      rates: {USD: 1, EUR: 0.92},
      time_last_update_utc: 'Thu, 08 May 2024 00:00:02 +0000',
    };
    const result = normalizeOpenEr(json);
    expect(result.source).toBe('open-er-api');
    expect(result.rates.USD).toBe(1);
    expect(result.rates.EUR).toBe(0.92);
    expect(result.date).toBe('2024-05-08');
  });

  it('throws when result is not success', () => {
    expect(() => normalizeOpenEr({result: 'error', rates: {}})).toThrow();
  });
});

// ---------------------------------------------------------------------------
// fetchRates — fetch mock setup
// ---------------------------------------------------------------------------

const FAWAZ_RESPONSE = {
  date: '2024-05-08',
  usd: {eur: 0.92, pkr: 279.6},
};

const OPEN_ER_RESPONSE = {
  result: 'success',
  rates: {USD: 1, EUR: 0.91},
  time_last_update_utc: 'Thu, 08 May 2024 00:00:02 +0000',
};

function mockFetch(responses) {
  // responses: Map<url-substring, {ok, json}> or array of handlers
  let calls = 0;
  return vi.fn(async (url) => {
    for (const [matcher, res] of responses) {
      if (url.includes(matcher)) {
        if (res === 'throw') throw new Error(`mocked error for ${url}`);
        return {
          ok: true,
          json: async () => res,
        };
      }
    }
    throw new Error(`unmocked fetch call: ${url}`);
  });
}

describe('fetchRates', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns rates from jsDelivr on success (provider 1)', async () => {
    global.fetch = mockFetch([
      ['jsdelivr', FAWAZ_RESPONSE],
    ]);
    const result = await fetchRates('USD', 'latest');
    expect(result.source).toBe('fawazahmed0');
    expect(result.rates.EUR).toBe(0.92);
    expect(result.rates.PKR).toBe(279.6);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('falls back to Cloudflare when jsDelivr throws (provider 2)', async () => {
    let callCount = 0;
    global.fetch = vi.fn(async (url) => {
      callCount++;
      if (url.includes('jsdelivr')) throw new Error('jsDelivr down');
      if (url.includes('currency-api.pages.dev')) {
        return {ok: true, json: async () => FAWAZ_RESPONSE};
      }
      throw new Error(`unexpected url: ${url}`);
    });
    const result = await fetchRates('USD', 'latest');
    expect(result.source).toBe('fawazahmed0');
    expect(callCount).toBe(2);
  });

  it('falls back to open.er-api when both fawaz providers fail (provider 3, latest)', async () => {
    global.fetch = vi.fn(async (url) => {
      if (url.includes('jsdelivr') || url.includes('currency-api.pages.dev')) {
        throw new Error('fawaz down');
      }
      if (url.includes('open.er-api.com')) {
        return {ok: true, json: async () => OPEN_ER_RESPONSE};
      }
      throw new Error(`unexpected url: ${url}`);
    });
    const result = await fetchRates('USD', 'latest');
    expect(result.source).toBe('open-er-api');
    expect(result.rates.EUR).toBe(0.91);
  });

  it('throws when all providers fail for latest', async () => {
    global.fetch = vi.fn(async () => {
      throw new Error('network error');
    });
    await expect(fetchRates('USD', 'latest')).rejects.toThrow();
  });

  it('throws when both fawaz providers fail for a historical date (no open.er fallback)', async () => {
    global.fetch = vi.fn(async () => {
      throw new Error('network error');
    });
    await expect(fetchRates('USD', '2022-01-01')).rejects.toThrow(
      /All rate providers failed/
    );
  });

  it('does NOT call open.er-api for historical dates', async () => {
    let openErCalled = false;
    global.fetch = vi.fn(async (url) => {
      if (url.includes('open.er-api.com')) openErCalled = true;
      throw new Error('all down');
    });
    await fetchRates('USD', '2022-01-01').catch(() => {});
    expect(openErCalled).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// fetchCurrencyList
// ---------------------------------------------------------------------------

describe('fetchCurrencyList', () => {
  beforeEach(() => {
    _resetCurrencyCache();
    vi.restoreAllMocks();
  });

  it('returns sorted list of {code, name} objects', async () => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({usd: 'United States Dollar', eur: 'Euro', pkr: 'Pakistani Rupee'}),
    }));
    const list = await fetchCurrencyList();
    expect(list[0].code).toBe('EUR');
    expect(list[1].code).toBe('PKR');
    expect(list[2].code).toBe('USD');
    expect(list[0].name).toBe('Euro');
    // All codes should be uppercase
    list.forEach((item) => expect(item.code).toMatch(/^[A-Z0-9]+$/));
  });

  it('caches the result and does not re-fetch on second call', async () => {
    const fetchFn = vi.fn(async () => ({
      ok: true,
      json: async () => ({usd: 'United States Dollar'}),
    }));
    global.fetch = fetchFn;
    await fetchCurrencyList();
    await fetchCurrencyList();
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('falls back to Cloudflare when jsDelivr fails', async () => {
    let calls = 0;
    global.fetch = vi.fn(async (url) => {
      calls++;
      if (url.includes('jsdelivr')) throw new Error('jsDelivr down');
      return {ok: true, json: async () => ({gbp: 'British Pound'})};
    });
    const list = await fetchCurrencyList();
    expect(list[0].code).toBe('GBP');
    expect(calls).toBe(2);
  });
});
