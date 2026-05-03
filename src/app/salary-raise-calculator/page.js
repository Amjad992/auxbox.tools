'use client';
import {useEffect} from 'react';
import Script from 'next/script';
import HeroSection from './components/HeroSection';
import HoursPerWeekCard from './components/HoursPerWeekCard';
import PaySection from './components/PaySection';
import Actions from './components/Actions';
import ResultsSummary from './components/ResultsSummary';
import ErrorBoundary from '../../components/ErrorBoundary';
import ToastContainer from '../../components/ToastContainer';
import {StorageProvider, useStorageData} from './StorageContext';
import {useRaiseCalculator} from './hooks';
import {useToast} from '../../hooks/useToast';
import './raise-calculator.css';

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
    <main className="raise-calculator-page">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <ErrorBoundary message="There was an error loading the calculator. Please refresh the page.">
        <div className="container">
          <HeroSection />

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
        </div>
      </ErrorBoundary>
    </main>
  );
}

export default function SalaryRaiseCalculator() {
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Salary Raise Calculator',
    description:
      'Free online salary raise calculator. Convert pay between hourly, weekly, monthly and annual, and see exactly what a percentage or dollar raise looks like across every period.',
    url: 'https://auxbox.tools/salary-raise-calculator',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <>
      <Script
        id="raise-webapp-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(webAppSchema)}}
      />
      <StorageProvider>
        <SalaryRaiseCalculatorContent />
      </StorageProvider>
    </>
  );
}
