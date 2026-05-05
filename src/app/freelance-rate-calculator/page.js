'use client';
import {useEffect, useMemo, useState} from 'react';
import ToolPage from '../../components/ToolPage';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ModeToggle from '../../components/ModeToggle';
import ToastContainer from '../../components/ToastContainer';
import {useToast} from '../../hooks/useToast';
import {useAutoSave} from '../../hooks/useAutoSave';
import {useHydrateStorage} from '../../hooks/useHydrateStorage';
import {StorageProvider, useStorageData} from './StorageContext';
import {
  DEFAULT_STATE,
  MODES,
  MODE_OPTIONS,
  STATE_AUTOSAVE_DEBOUNCE_MS,
} from './constants';
import {quote} from './utils';
import CurrencyCard from './components/CurrencyCard';
import QuoteInputs from './components/QuoteInputs';
import QuoteResult from './components/QuoteResult';
import FeesCard from './components/FeesCard';
import './freelance-rate-calculator.css';

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Freelance Rate Calculator',
  description:
    'Free freelance rate calculator. Quote a job, project income from a rate, or back-solve the rate for a target take-home — accounting for time, costs, fees, taxes, team and profit margin. Browser-only.',
  url: 'https://auxbox.tools/freelance-rate-calculator',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Any',
  offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'},
};

function toNumberOrNull(raw) {
  if (raw === '' || raw === null || raw === undefined) return null;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : null;
}

function FreelanceRateCalculatorContent() {
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
  const updateFees = (fees) => {
    markDirty();
    setState((prev) => ({...prev, fees}));
  };

  const handleClear = () => {
    clearState();
    setState(DEFAULT_STATE);
    markClean();
    showToast('Cleared', 'success');
  };

  const canClear = useMemo(
    () => JSON.stringify(state) !== JSON.stringify(DEFAULT_STATE),
    [state]
  );

  const quoteResult = useMemo(
    () =>
      quote({
        hours: toNumberOrNull(state.hours) ?? 0,
        rate: toNumberOrNull(state.rate) ?? 0,
        fees: state.fees,
      }),
    [state.hours, state.rate, state.fees]
  );

  return (
    <ToolPage
      title="Freelance Rate Calculator"
      tagline="Quote a job, project income from a rate, or back-solve the rate that hits your target take-home — fees, costs, taxes, team, and profit margin all in one place."
      schema={SCHEMA}
      schemaId="freelance-rate-calculator-schema"
      errorMessage="There was an error loading the rate calculator. Please refresh the page."
    >
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="frc-stack">
        <Card>
          <div className="frc-mode-row">
            <ModeToggle
              ariaLabel="Calculation mode"
              ariaDescribedBy="frc-mode-hint"
              options={MODE_OPTIONS}
              value={state.mode}
              onChange={(next) => update({mode: next})}
            />
            <p id="frc-mode-hint" className="frc-mode-hint">
              {state.mode === MODES.QUOTE &&
                'Multiply hours by rate and back out the take-home after fees and tax.'}
              {state.mode === MODES.INCOME &&
                'Project hourly, daily, weekly, monthly and annual gross + net for a given rate.'}
              {state.mode === MODES.RATE &&
                'Set a target annual take-home and back-solve the hourly rate that gets you there.'}
            </p>
          </div>
        </Card>

        <CurrencyCard
          value={state.currency}
          onChange={(currency) => update({currency})}
        />

        {state.mode === MODES.QUOTE && (
          <>
            <QuoteInputs
              hours={state.hours}
              rate={state.rate}
              currency={state.currency}
              onHoursChange={(v) => update({hours: toNumberOrNull(v)})}
              onRateChange={(v) => update({rate: toNumberOrNull(v)})}
            />
            <FeesCard value={state.fees} onChange={updateFees} />
            <QuoteResult
              result={quoteResult}
              currency={state.currency}
              hours={toNumberOrNull(state.hours) ?? 0}
            />
          </>
        )}

        {state.mode !== MODES.QUOTE && (
          <Card>
            <p className="frc-coming-soon">
              {state.mode === MODES.INCOME
                ? 'Income mode lands in the next commit.'
                : 'Rate mode lands in the next commit.'}
            </p>
          </Card>
        )}

        <div className="frc-actions">
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

export default function FreelanceRateCalculator() {
  return (
    <StorageProvider>
      <FreelanceRateCalculatorContent />
    </StorageProvider>
  );
}
