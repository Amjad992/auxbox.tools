'use client';
import {useEffect, useMemo, useState} from 'react';
import ToolPage from '../../components/ToolPage';
import Card from '../../components/Card';
import Button from '../../components/Button';
import CurrencyInput from '../../components/CurrencyInput';
import CurrencySelect from '../../components/CurrencySelect';
import Slider from '../../components/Slider';
import ToastContainer from '../../components/ToastContainer';
import {useToast} from '../../hooks/useToast';
import {useAutoSave} from '../../hooks/useAutoSave';
import {useHydrateStorage} from '../../hooks/useHydrateStorage';
import {useCopyToClipboard} from '../../hooks/useCopyToClipboard';
import {formatCurrency} from '../../lib/format';
import {StorageProvider, useStorageData} from './StorageContext';
import {
  BOUNDS,
  DEFAULT_STATE,
  STATE_AUTOSAVE_DEBOUNCE_MS,
  TIP_PRESETS,
} from './constants';
import {calculateTip} from './utils';
import './tip-calculator.css';

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Bill & Tip Calculator',
  description:
    'Free bill and tip calculator. Enter your bill, tip percent and number of people; see total and per-person split. Browser-only, no upload.',
  url: 'https://auxbox.tools/tip-calculator',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Any',
  offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'},
};

function toNumberOrNull(raw) {
  if (raw === '' || raw === null || raw === undefined) return null;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : null;
}

function TipCalculatorContent() {
  const {toasts, showToast, dismissToast} = useToast();
  const {loadState, saveState, clearState, storageErrors} = useStorageData();
  const [state, setState] = useState(DEFAULT_STATE);

  const hydrated = useHydrateStorage(() => {
    const saved = loadState();
    if (saved && typeof saved === 'object') {
      setState((prev) => ({...prev, ...saved}));
    }
  });

  useEffect(() => {
    if (storageErrors?.state) {
      showToast(`${storageErrors.state}. Using defaults.`, 'error');
    }
  }, [storageErrors?.state, showToast]);

  const {markDirty, markClean} = useAutoSave({
    onSave: () => saveState(state),
    enabled: hydrated,
    deps: [state],
    debounceMs: STATE_AUTOSAVE_DEBOUNCE_MS,
  });

  const update = (patch) => {
    markDirty();
    setState((prev) => ({...prev, ...patch}));
  };

  const handleClear = () => {
    clearState();
    setState(DEFAULT_STATE);
    markClean();
    showToast('Cleared', 'success');
  };

  const canClear = useMemo(
    () =>
      state.currency !== DEFAULT_STATE.currency ||
      state.bill !== DEFAULT_STATE.bill ||
      state.tipPct !== DEFAULT_STATE.tipPct ||
      state.people !== DEFAULT_STATE.people,
    [state.currency, state.bill, state.tipPct, state.people]
  );

  const result = useMemo(
    () =>
      calculateTip({
        bill: toNumberOrNull(state.bill) ?? 0,
        tipPct: state.tipPct,
        people: state.people,
      }),
    [state.bill, state.tipPct, state.people]
  );

  const billNum = toNumberOrNull(state.bill) ?? 0;
  const hasBill = billNum > 0;

  const summaryText = hasBill
    ? `${formatCurrency(billNum, state.currency)} bill, ${state.tipPct}% tip, ${
        state.people
      } ${state.people === 1 ? 'person' : 'people'} → ${formatCurrency(
        result.perPerson,
        state.currency
      )} each (total ${formatCurrency(result.total, state.currency)}).`
    : '';

  const copy = useCopyToClipboard({
    showToast,
    successMessage: 'Summary copied',
  });

  return (
    <ToolPage
      title="Bill & Tip Calculator"
      tagline="Bill + tip + people → total and per-person split. Mobile-friendly, runs entirely in your browser."
      schema={SCHEMA}
      schemaId="tip-calculator-schema"
      errorMessage="There was an error loading the calculator. Please refresh the page."
    >
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="tc-stack">
        <Card>
          <h2 className="tc-card-title">Bill</h2>
          <div className="tc-bill-row">
            <CurrencyInput
              id="tc-bill"
              label="Bill amount"
              currency={state.currency}
              step="0.01"
              min="0"
              value={state.bill ?? ''}
              onChange={(e) =>
                update({bill: toNumberOrNull(e.target.value)})
              }
              placeholder="0.00"
            />
            <CurrencySelect
              id="tc-currency"
              value={state.currency}
              onChange={(v) => update({currency: v})}
              labelStyle="code"
            />
          </div>
        </Card>

        <Card>
          <h2 className="tc-card-title">Tip</h2>
          <Slider
            id="tc-tip-pct"
            label="Tip percent"
            value={state.tipPct}
            min={BOUNDS.TIP_PCT_MIN}
            max={BOUNDS.TIP_PCT_MAX}
            step={1}
            onChange={(v) => update({tipPct: v})}
            formatValue={(v) => `${v}%`}
            leftHint={`${BOUNDS.TIP_PCT_MIN}%`}
            rightHint={`${BOUNDS.TIP_PCT_MAX}%`}
          />
          <div className="tc-presets">
            {TIP_PRESETS.map((p) => {
              const active = state.tipPct === p;
              return (
                <button
                  type="button"
                  key={p}
                  className={`tc-preset${active ? ' tc-preset--active' : ''}`}
                  onClick={() => update({tipPct: p})}
                  aria-pressed={active}
                >
                  {p}%
                </button>
              );
            })}
          </div>
        </Card>

        <Card>
          <h2 className="tc-card-title">Split</h2>
          <Slider
            id="tc-people"
            label="Number of people"
            value={state.people}
            min={BOUNDS.PEOPLE_MIN}
            max={BOUNDS.PEOPLE_MAX}
            step={1}
            onChange={(v) => update({people: v})}
            formatValue={(v) => `${v} ${v === 1 ? 'person' : 'people'}`}
            leftHint={`${BOUNDS.PEOPLE_MIN}`}
            rightHint={`${BOUNDS.PEOPLE_MAX}`}
          />
        </Card>

        <Card>
          <h2 className="tc-card-title">Result</h2>
          <div className="tc-result-region" aria-live="polite" aria-atomic="true">
            {hasBill ? (
              <div className="tc-result">
                <div className="tc-result-headline">
                  <p className="tc-result-headline-label">Per person</p>
                  <p className="tc-result-headline-value">
                    {formatCurrency(result.perPerson, state.currency, {
                      alwaysDecimals: true,
                    })}
                  </p>
                  <p className="tc-result-headline-sub">
                    {state.people === 1
                      ? 'just you'
                      : `split between ${state.people} people`}
                  </p>
                </div>
                <div className="tc-result-line tc-result-line--muted">
                  <span>Subtotal</span>
                  <span className="tc-result-amount">
                    {formatCurrency(result.bill, state.currency, {
                      alwaysDecimals: true,
                    })}
                  </span>
                </div>
                <div className="tc-result-line tc-result-line--muted">
                  <span>Tip ({state.tipPct}%)</span>
                  <span className="tc-result-amount">
                    {formatCurrency(result.tipAmount, state.currency, {
                      alwaysDecimals: true,
                    })}
                  </span>
                </div>
                <div className="tc-result-divider" />
                <div className="tc-result-line">
                  <span>
                    <strong>Total</strong>
                  </span>
                  <span className="tc-result-amount">
                    <strong>
                      {formatCurrency(result.total, state.currency, {
                        alwaysDecimals: true,
                      })}
                    </strong>
                  </span>
                </div>
                <div className="tc-result-footer">
                  <span className="tc-result-chip">
                    Per-person tip:{' '}
                    {formatCurrency(result.perPersonTip, state.currency, {
                      alwaysDecimals: true,
                    })}
                  </span>
                </div>
              </div>
            ) : (
              <p className="tc-empty">
                Enter a bill amount to see the split.
              </p>
            )}
          </div>
        </Card>

        <div className="tc-actions">
          <Button
            variant="primary"
            onClick={() => copy(summaryText)}
            disabled={!hasBill}
          >
            Copy summary
          </Button>
          <Button
            variant="neutral"
            onClick={handleClear}
            disabled={!canClear}
          >
            Clear
          </Button>
        </div>
      </div>
    </ToolPage>
  );
}

export default function TipCalculator() {
  return (
    <StorageProvider>
      <TipCalculatorContent />
    </StorageProvider>
  );
}
