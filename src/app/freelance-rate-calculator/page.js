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
import {
  billableHoursPerYear,
  incomeForRate,
  quote,
  requiredRateForTakeHome,
  totalAnnualCosts,
} from './utils';
import {COSTS_VIEW, COST_PERIOD} from './constants';
import CurrencyCard from './components/CurrencyCard';
import QuoteInputs from './components/QuoteInputs';
import QuoteResult from './components/QuoteResult';
import IncomeInputs from './components/IncomeInputs';
import IncomeResult from './components/IncomeResult';
import RateInputs from './components/RateInputs';
import RateResult from './components/RateResult';
import FeesCard from './components/FeesCard';
import TimeCard from './components/TimeCard';
import CostsCard from './components/CostsCard';
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

  const annualCosts = useMemo(() => {
    if (state.costs.view === COSTS_VIEW.QUICK) {
      const amt = toNumberOrNull(state.costs.quickAmount) ?? 0;
      return state.costs.quickPeriod === COST_PERIOD.ANNUAL ? amt : amt * 12;
    }
    return totalAnnualCosts(state.costs.lineItems);
  }, [state.costs]);

  const billable = useMemo(
    () => billableHoursPerYear(state.time),
    [state.time]
  );

  const incomeResult = useMemo(
    () =>
      incomeForRate({
        rate: toNumberOrNull(state.rate) ?? 0,
        billableHours: billable,
        costs: annualCosts,
        fees: state.fees,
        people: state.team.people,
      }),
    [state.rate, billable, annualCosts, state.fees, state.team.people]
  );

  const rateResult = useMemo(
    () =>
      requiredRateForTakeHome({
        targetIncome: toNumberOrNull(state.targetIncome) ?? 0,
        billableHours: billable,
        costs: annualCosts,
        fees: state.fees,
        profitMargin: state.profitMargin,
        people: state.team.people,
      }),
    [
      state.targetIncome,
      billable,
      annualCosts,
      state.fees,
      state.profitMargin,
      state.team.people,
    ]
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

        {state.mode === MODES.INCOME && (
          <>
            <IncomeInputs
              rate={state.rate}
              currency={state.currency}
              onRateChange={(v) => update({rate: toNumberOrNull(v)})}
            />
            <TimeCard
              value={state.time}
              onChange={(time) => update({time})}
            />
            <CostsCard
              value={state.costs}
              currency={state.currency}
              onChange={(costs) => update({costs})}
            />
            <FeesCard value={state.fees} onChange={updateFees} />
            <IncomeResult
              result={incomeResult}
              currency={state.currency}
              hasRate={(toNumberOrNull(state.rate) ?? 0) > 0}
            />
          </>
        )}

        {state.mode === MODES.RATE && (
          <>
            <RateInputs
              targetIncome={state.targetIncome}
              currency={state.currency}
              onChange={(v) => update({targetIncome: toNumberOrNull(v)})}
            />
            <TimeCard
              value={state.time}
              onChange={(time) => update({time})}
            />
            <CostsCard
              value={state.costs}
              currency={state.currency}
              onChange={(costs) => update({costs})}
            />
            <FeesCard value={state.fees} onChange={updateFees} />
            <RateResult
              result={rateResult}
              currency={state.currency}
              hasTarget={(toNumberOrNull(state.targetIncome) ?? 0) > 0}
              time={state.time}
              costs={annualCosts}
              fees={state.fees}
              profitMargin={state.profitMargin}
              people={state.team.people}
              utilizationCurrent={state.time.utilization}
            />
          </>
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
