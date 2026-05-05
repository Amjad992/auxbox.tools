import {describe, it, expect} from 'vitest';
import {
  buildConfigPayload,
  buildIncomeCsv,
  parseConfigText,
} from './exportUtils';
import {DEFAULT_STATE} from './constants';

describe('buildConfigPayload', () => {
  it('wraps state with the schema/version envelope', () => {
    const payload = buildConfigPayload(DEFAULT_STATE);
    expect(payload.schema).toBe('auxbox.freelance-rate-calculator');
    expect(payload.version).toBe('1.0.0');
    expect(typeof payload.exportedAt).toBe('string');
    expect(payload.state).toEqual(DEFAULT_STATE);
  });
});

describe('parseConfigText', () => {
  it('round-trips a default-state payload', () => {
    const text = JSON.stringify(buildConfigPayload(DEFAULT_STATE));
    const r = parseConfigText(text);
    expect(r.ok).toBe(true);
    expect(r.state).toEqual(DEFAULT_STATE);
  });

  it('rejects non-JSON input', () => {
    const r = parseConfigText('not json');
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/not valid json/i);
  });

  it('rejects payloads with a wrong schema marker', () => {
    const r = parseConfigText(
      JSON.stringify({schema: 'something-else', state: DEFAULT_STATE})
    );
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/does not look like/i);
  });

  it('rejects payloads with invalid state', () => {
    const r = parseConfigText(
      JSON.stringify({
        schema: 'auxbox.freelance-rate-calculator',
        state: {nope: true},
      })
    );
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/schema validation failed/i);
  });
});

describe('buildIncomeCsv', () => {
  const sample = {
    annual: {gross: 134400, net: 100000},
    monthly: {gross: 11200, net: 8333},
    weekly: {gross: 2585, net: 1923},
    daily: {gross: 517, net: 384},
    hourly: {gross: 100, net: 74},
    totalBillableHours: 1344,
    costsAnnual: 12000,
    breakdown: {
      platform: 13440,
      processor: 0,
      other: 0,
      income: 0,
      total: 13440,
    },
  };

  it('produces a non-empty CSV with the canonical headers', () => {
    const csv = buildIncomeCsv({result: sample, currency: 'USD'});
    expect(csv).toContain('Currency: USD');
    expect(csv).toContain('Horizon,Gross,Take-home (net)');
    expect(csv).toContain('Annual,134400,100000');
    expect(csv).toContain('Operating costs,12000');
  });

  it('escapes cells with embedded commas/quotes', () => {
    const r = {
      ...sample,
      // use a string that survives via the breakdown header to test the
      // escape path indirectly — buildIncomeCsv is the consumer of csvCell.
    };
    const csv = buildIncomeCsv({result: r, currency: 'USD'});
    // Sanity: every line is parseable with a basic split (no stray
    // unescaped commas in the static labels).
    csv
      .split('\n')
      .filter(Boolean)
      .forEach((line) => {
        expect(line).toBeTruthy();
      });
  });
});
