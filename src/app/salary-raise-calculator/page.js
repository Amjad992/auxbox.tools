'use client';
import {useEffect} from 'react';
import ToolPage from '../../components/ToolPage';
import ToastContainer from '../../components/ToastContainer';
import HoursPerWeekCard from './components/HoursPerWeekCard';
import PaySection from './components/PaySection';
import Actions from './components/Actions';
import ResultsSummary from './components/ResultsSummary';
import {StorageProvider, useStorageData} from './StorageContext';
import {useRaiseCalculator} from './hooks';
import {useToast} from '../../hooks/useToast';
import './raise-calculator.css';

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Salary Raise Calculator',
  description:
    'Free online salary raise calculator. Convert pay between hourly, weekly, monthly and annual, and see exactly what a percentage or dollar raise looks like across every period.',
  url: 'https://auxbox.tools/salary-raise-calculator',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Any',
  offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'},
};

function SalaryRaiseCalculatorContent() {
  const {toasts, showToast, dismissToast} = useToast();
  const {storageErrors} = useStorageData();

  useEffect(() => {
    if (storageErrors?.state) {
      showToast(`${storageErrors.state}. Using defaults.`, 'error');
    }
  }, [storageErrors?.state, showToast]);

  const {
    inputs,
    handleChange,
    reset,
    save,
    clearSaved,
    hasSavedData,
    summary,
  } = useRaiseCalculator();

  const onSave = () => {
    if (save()) showToast('Saved locally', 'success');
  };

  const onClearSaved = () => {
    clearSaved();
    showToast('Saved data cleared', 'success');
  };

  return (
    <ToolPage
      title="Salary Raise Calculator"
      tagline="Plug in your pay, see exactly what a raise looks like across hourly, weekly, monthly and annual."
      schema={SCHEMA}
      schemaId="raise-schema"
      narrow
      errorMessage="There was an error loading the calculator. Please refresh the page."
    >
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="pay-stack">
        <HoursPerWeekCard value={inputs.hpw} onChange={handleChange} />

        <PaySection
          title="Pay before raise"
          group="before"
          values={inputs.before}
          onChange={handleChange}
        />

        <PaySection
          title="Raise"
          group="raise"
          values={inputs.raise}
          onChange={handleChange}
          showPercent
          percentValue={inputs.raise.percent}
        />

        <PaySection
          title="Pay after raise"
          group="after"
          values={inputs.after}
          onChange={handleChange}
        />

        <ResultsSummary summary={summary} />

        <Actions
          onSave={onSave}
          onClearSaved={onClearSaved}
          onReset={reset}
          hasSavedData={hasSavedData}
        />
      </div>
    </ToolPage>
  );
}

export default function SalaryRaiseCalculator() {
  return (
    <StorageProvider>
      <SalaryRaiseCalculatorContent />
    </StorageProvider>
  );
}
