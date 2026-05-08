'use client';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {DateTime} from 'luxon';
import ToolPage from '../../components/ToolPage';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Combobox from '../../components/Combobox';
import DatePicker from '../../components/DatePicker';
import ToastContainer from '../../components/ToastContainer';
import {useToast} from '../../hooks/useToast';
import {useAutoSave} from '../../hooks/useAutoSave';
import {useHydrateStorage} from '../../hooks/useHydrateStorage';
import {StorageProvider, useStorageData} from './StorageContext';
import {
  DEFAULT_STATE,
  DEFAULT_AMOUNT,
  DATE_MIN,
  MAX_TARGETS,
  SESSION_CACHE_TTL_MS,
  STATE_AUTOSAVE_DEBOUNCE_MS,
} from './constants';
import {fetchRates, fetchCurrencyList} from '../../lib/forex';
import './exchange-rates.css';

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Exchange Rates',
  description:
    'Free currency exchange-rate lookup. Pick a base currency and date, add targets, enter an amount. Browser-only.',
  url: 'https://auxbox.tools/exchange-rates',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Any',
  offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'},
};

// ---------------------------------------------------------------------------
// Session-storage rate cache (5 min TTL)
// ---------------------------------------------------------------------------

function buildCacheKey(base, date) {
  return `forex-cache:${base}:${date}`;
}

function getCachedRates(base, date) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(buildCacheKey(base, date));
    if (!raw) return null;
    const {ts, payload} = JSON.parse(raw);
    if (DateTime.now().toMillis() - ts > SESSION_CACHE_TTL_MS) {
      window.sessionStorage.removeItem(buildCacheKey(base, date));
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function setCachedRates(base, date, payload) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(
      buildCacheKey(base, date),
      JSON.stringify({ts: DateTime.now().toMillis(), payload})
    );
  } catch {
    // storage quota — silently ignore
  }
}

// ---------------------------------------------------------------------------
// Rate formatting — more decimals for small/crypto values
// ---------------------------------------------------------------------------

function formatRate(rate) {
  if (!Number.isFinite(rate) || rate === 0) return '—';
  if (rate >= 1) {
    return rate.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  }
  if (rate >= 0.0001) return rate.toFixed(6);
  return rate.toExponential(4);
}

function formatConverted(rate, amount) {
  const val = rate * amount;
  if (!Number.isFinite(val)) return '—';
  if (val >= 1) {
    return val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  }
  if (val >= 0.0001) return val.toFixed(6);
  return val.toExponential(4);
}

// ---------------------------------------------------------------------------
// Inner component (wrapped in StorageProvider)
// ---------------------------------------------------------------------------

function ExchangeRatesContent() {
  const {toasts, showToast, dismissToast} = useToast();
  const {loadState, saveState, clearState, storageErrors} = useStorageData();

  // Core state
  const [base, setBase] = useState(DEFAULT_STATE.base);
  const [targets, setTargets] = useState(DEFAULT_STATE.targets);
  const [amount, setAmount] = useState(DEFAULT_AMOUNT);
  const [date, setDate] = useState(() => DateTime.now().startOf('day'));

  // Currency list — loaded once
  const [currencyList, setCurrencyList] = useState([]);

  // Rate fetch state
  const [ratesResult, setRatesResult] = useState(null); // {rates, source, date}
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const abortRef = useRef(null);

  // ---------------------------------------------------------------------------
  // Hydrate from storage
  // ---------------------------------------------------------------------------

  const hydrated = useHydrateStorage(() => {
    const saved = loadState();
    if (saved && typeof saved === 'object') {
      if (typeof saved.base === 'string') setBase(saved.base);
      if (Array.isArray(saved.targets)) setTargets(saved.targets);
      if (typeof saved.amount === 'number') setAmount(saved.amount);
      // lastDate is stored but we intentionally reset to today on load.
    }
  });

  useEffect(() => {
    if (storageErrors?.state) {
      showToast(`${storageErrors.state}. Using defaults.`, 'error');
    }
  }, [storageErrors?.state, showToast]);

  // ---------------------------------------------------------------------------
  // Persist state with auto-save
  // ---------------------------------------------------------------------------

  const {markDirty, markClean} = useAutoSave({
    onSave: () => saveState({base, targets, amount}),
    enabled: hydrated,
    deps: [base, targets, amount],
    debounceMs: STATE_AUTOSAVE_DEBOUNCE_MS,
  });

  // ---------------------------------------------------------------------------
  // Load currency list on mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const controller = new AbortController();
    fetchCurrencyList(controller.signal)
      .then(setCurrencyList)
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          showToast('Could not load currency list. Using codes only.', 'error');
        }
      });
    return () => controller.abort();
  }, [showToast]);

  // ---------------------------------------------------------------------------
  // Fetch rates whenever base or date changes
  // ---------------------------------------------------------------------------

  const dateIso = date?.isValid ? date.toISODate() : null;

  const loadRates = useCallback(
    async (newBase, newDateIso) => {
      if (!newDateIso) return;

      // Check session cache first
      const cached = getCachedRates(newBase, newDateIso);
      if (cached) {
        setRatesResult(cached);
        setFetchError(false);
        return;
      }

      // Abort any in-flight fetch
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setFetchError(false);

      const today = DateTime.now().toISODate();
      const tag = newDateIso === today ? 'latest' : newDateIso;

      try {
        const result = await fetchRates(newBase, tag, controller.signal);
        if (controller.signal.aborted) return;
        setRatesResult(result);
        setCachedRates(newBase, newDateIso, result);
        setFetchError(false);
      } catch (err) {
        if (err?.name === 'AbortError' || controller.signal.aborted) return;
        setFetchError(true);
        showToast('Rate lookup failed. Check your connection.', 'error');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (dateIso) loadRates(base, dateIso);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, dateIso]);

  // Cleanup on unmount
  useEffect(() => () => abortRef.current?.abort(), []);

  // ---------------------------------------------------------------------------
  // Currency combobox options
  // ---------------------------------------------------------------------------

  const allCurrencyOptions = useMemo(
    () =>
      currencyList.map((c) => ({
        value: c.code,
        label: `${c.code} — ${c.name}`,
      })),
    [currencyList]
  );

  const addTargetOptions = useMemo(() => {
    const used = new Set([base, ...targets]);
    return allCurrencyOptions.filter((o) => !used.has(o.value));
  }, [allCurrencyOptions, base, targets]);

  const baseOptions = useMemo(() => {
    const excl = new Set(targets);
    return allCurrencyOptions.filter((o) => !excl.has(o.value));
  }, [allCurrencyOptions, targets]);

  // Lookup helper: code → name
  const nameOf = useCallback(
    (code) => {
      const found = currencyList.find((c) => c.code === code);
      return found ? found.name : code;
    },
    [currencyList]
  );

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleBaseChange = (opt) => {
    markDirty();
    // If the selected base was already a target, remove it from targets.
    if (targets.includes(opt.value)) {
      setTargets((prev) => prev.filter((t) => t !== opt.value));
    }
    setBase(opt.value);
  };

  const handleAddTarget = useCallback(
    (opt) => {
      if (!opt?.value) return;
      if (targets.includes(opt.value)) {
        showToast('Currency already in list', 'error');
        return;
      }
      if (targets.length >= MAX_TARGETS) {
        showToast(`Maximum ${MAX_TARGETS} targets`, 'error');
        return;
      }
      markDirty();
      setTargets((prev) => [...prev, opt.value]);
    },
    [targets, showToast, markDirty]
  );

  const handleRemoveTarget = (code) => {
    markDirty();
    setTargets((prev) => prev.filter((t) => t !== code));
  };

  const handleAmountChange = (e) => {
    const val = parseFloat(e.target.value);
    const next = Number.isFinite(val) && val >= 0 ? val : 0;
    markDirty();
    setAmount(next);
  };

  const handleDateChange = (dt) => {
    if (!dt?.isValid) return;
    // Clamp to min
    const minDt = DateTime.fromISO(DATE_MIN);
    const today = DateTime.now().startOf('day');
    const clamped = dt < minDt ? minDt : dt > today ? today : dt;
    setDate(clamped);
  };

  const handleToday = () => {
    setDate(DateTime.now().startOf('day'));
    showToast('Date set to today', 'success');
  };

  const handleRetry = () => {
    setFetchError(false);
    if (dateIso) loadRates(base, dateIso);
  };

  const handleReset = () => {
    clearState();
    setBase(DEFAULT_STATE.base);
    setTargets(DEFAULT_STATE.targets);
    setAmount(DEFAULT_AMOUNT);
    setDate(DateTime.now().startOf('day'));
    setRatesResult(null);
    setFetchError(false);
    markClean();
    showToast('Reset to defaults', 'success');
  };

  // ---------------------------------------------------------------------------
  // Derive table rows
  // ---------------------------------------------------------------------------

  const tableRows = useMemo(() => {
    if (!ratesResult) return [];
    return targets.map((code) => {
      const rate = ratesResult.rates[code];
      return {
        code,
        name: nameOf(code),
        rate: rate ?? null,
        converted: rate != null ? formatConverted(rate, amount) : null,
        rateFormatted: rate != null ? formatRate(rate) : null,
        unsupported: rate == null,
      };
    });
  }, [ratesResult, targets, amount, nameOf]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const isToday = dateIso === DateTime.now().toISODate();

  return (
    <ToolPage
      title="Exchange Rates"
      tagline="Pick a base currency, date, and targets — see live rates. Browser-only, no API key."
      schema={SCHEMA}
      schemaId="exchange-rates-schema"
      errorMessage="There was an error loading the exchange rates tool. Please refresh the page."
    >
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="tool-stack er-grid">

        {/* Top row: Base + Date */}
        <div className="er-top-row">
          <Card>
            <h2 className="tool-card-title">Base currency</h2>
            <Combobox
              label="Base currency"
              labelHidden
              placeholder="Search currency (e.g. USD, Euro)…"
              options={baseOptions}
              onSelect={handleBaseChange}
              maxVisible={30}
              renderOption={(opt) => (
                <span>{opt.label}</span>
              )}
            />
            {base && (
              <p className="er-hint" style={{marginTop: '0.5rem'}}>
                Current base: <strong>{base}</strong>{currencyList.length > 0 ? ` — ${nameOf(base)}` : ''}
              </p>
            )}
          </Card>

          <Card>
            <h2 className="tool-card-title">Date</h2>
            <div className="er-date-row">
              <DatePicker
                label="Rate date"
                value={date}
                onChange={handleDateChange}
              />
              {!isToday && (
                <Button variant="neutral" onClick={handleToday}>
                  Today
                </Button>
              )}
            </div>
            <p className="er-hint" style={{marginTop: '0.5rem'}}>
              Historical data from {DATE_MIN}.
            </p>
          </Card>
        </div>

        {/* Targets card */}
        <Card>
          <h2 className="tool-card-title">Target currencies</h2>
          {targets.length === 0 ? (
            <p className="er-empty" role="status" aria-live="polite">
              No target currencies. Add one below.
            </p>
          ) : (
            <div className="er-target-list">
              {targets.map((code) => (
                <div key={code} className="er-target-row">
                  <div className="er-target-info">
                    <span className="er-target-code">{code}</span>
                    {currencyList.length > 0 && (
                      <span className="er-target-name">{nameOf(code)}</span>
                    )}
                  </div>
                  <Button
                    variant="neutral"
                    onClick={() => handleRemoveTarget(code)}
                    aria-label={`Remove ${code}`}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="er-add-row">
            <Combobox
              label="Add target currency"
              labelHidden
              placeholder="Search currency to add…"
              options={addTargetOptions}
              onSelect={handleAddTarget}
              disabled={targets.length >= MAX_TARGETS}
              maxVisible={30}
              renderOption={(opt) => <span>{opt.label}</span>}
            />
          </div>
          {targets.length >= MAX_TARGETS && (
            <p className="er-hint">Maximum {MAX_TARGETS} currencies reached.</p>
          )}
        </Card>

        {/* Amount card */}
        <Card>
          <h2 className="tool-card-title">Amount</h2>
          <div className="er-amount-row">
            <div className="tool-field">
              <label htmlFor="er-amount" className="tool-field-label">
                {base} amount to convert
              </label>
              <input
                id="er-amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                className="tool-field-input"
                value={amount}
                onChange={handleAmountChange}
              />
            </div>
          </div>
        </Card>

        {/* Result table */}
        <Card>
          <h2 className="tool-card-title">Rates</h2>

          {loading && (
            <p className="er-loading-badge" role="status" aria-live="polite">
              Loading rates…
            </p>
          )}

          {fetchError && (
            <div className="er-error-card">
              <p className="er-error-title">Rates unavailable</p>
              <p className="er-error-msg">
                All rate providers failed. Check your connection and try again.
              </p>
              <Button variant="primary" onClick={handleRetry}>
                Retry
              </Button>
            </div>
          )}

          {!fetchError && targets.length === 0 && (
            <p className="er-empty" role="status">
              Add target currencies above to see rates.
            </p>
          )}

          {!fetchError && targets.length > 0 && (ratesResult || loading) && (
            <div className="er-table-wrap">
              <table className="er-table" aria-label="Exchange rate results">
                <thead>
                  <tr>
                    <th scope="col">Code</th>
                    <th scope="col">Currency</th>
                    <th scope="col">1 {base} =</th>
                    <th scope="col">{amount} {base} =</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && !ratesResult ? (
                    targets.map((code) => (
                      <tr key={code}>
                        <td className="er-td-code">{code}</td>
                        <td className="er-td-name">{currencyList.length > 0 ? nameOf(code) : '—'}</td>
                        <td className="er-td-rate">…</td>
                        <td className="er-td-converted">…</td>
                      </tr>
                    ))
                  ) : (
                    tableRows.map((row) => (
                      <tr key={row.code} style={row.unsupported ? {opacity: 0.4} : {}}>
                        <td className="er-td-code">{row.code}</td>
                        <td className="er-td-name">{row.name}</td>
                        <td className="er-td-rate">
                          {row.unsupported ? 'n/a' : row.rateFormatted}
                        </td>
                        <td className="er-td-converted">
                          {row.unsupported ? 'n/a' : row.converted}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {ratesResult && (
            <p className="er-attribution">
              Rates: {ratesResult.source === 'fawazahmed0'
                ? 'fawazahmed0/currency-api (CC0)'
                : 'Open Exchange Rates API'}
              {'. '}
              Date: {ratesResult.date || dateIso}.
            </p>
          )}
        </Card>

        {/* Actions */}
        <div className="tz-actions">
          <Button variant="neutral" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </div>
    </ToolPage>
  );
}

export default function ExchangeRates() {
  return (
    <StorageProvider>
      <ExchangeRatesContent />
    </StorageProvider>
  );
}
