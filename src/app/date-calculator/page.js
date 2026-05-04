'use client';
import {useEffect, useMemo, useRef, useState} from 'react';
import ToolPage from '../../components/ToolPage';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ModeToggle from '../../components/ModeToggle';
import ToastContainer from '../../components/ToastContainer';
import {useToast} from '../../hooks/useToast';
import {StorageProvider, useStorageData} from './StorageContext';
import {
  DEFAULT_STATE,
  MODES,
  MODE_OPTIONS,
  MODE_VALUES,
  STATE_AUTOSAVE_DEBOUNCE_MS,
  STORAGE_KEY,
} from './constants';
import {
  diffYMD,
  parseISODate,
  swapIfReversed,
  totalUnits,
  workingDaysBetween,
} from './utils';
import './date-calculator.css';

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Date Calculator',
  description:
    'Free date calculator. Find the difference between two dates, or your age from a date — in years, months, days, weeks, hours, and working days. Browser-only.',
  url: 'https://auxbox.tools/date-calculator',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Any',
  offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'},
};

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatYMD({years, months, days}) {
  if (years === 0 && months === 0 && days === 0) {
    return '0 days';
  }
  const parts = [];
  if (years > 0) parts.push(`${years} year${years === 1 ? '' : 's'}`);
  if (months > 0) parts.push(`${months} month${months === 1 ? '' : 's'}`);
  if (days > 0) parts.push(`${days} day${days === 1 ? '' : 's'}`);
  return parts.join(', ');
}

function DateCalculatorContent() {
  const {toasts, showToast, dismissToast} = useToast();
  const {loadState, saveState, clearState, storageErrors} = useStorageData();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [mode, setMode] = useState(MODES.DIFFERENCE);
  const [includeWorkingDays, setIncludeWorkingDays] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const dirtyRef = useRef(false);
  const [today, setToday] = useState(todayISO);

  // Hydrate once on mount.
  useEffect(() => {
    const saved = loadState();
    if (saved && typeof saved === 'object') {
      if (typeof saved.startDate === 'string') setStartDate(saved.startDate);
      if (typeof saved.endDate === 'string') setEndDate(saved.endDate);
      if (typeof saved.mode === 'string' && MODE_VALUES.includes(saved.mode)) {
        setMode(saved.mode);
      }
      if (typeof saved.includeWorkingDays === 'boolean') {
        setIncludeWorkingDays(saved.includeWorkingDays);
      }
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recompute "today" once per mount so an SSR-mismatched value isn't shown.
  useEffect(() => {
    setToday(todayISO());
  }, []);

  useEffect(() => {
    if (storageErrors?.state) {
      showToast(`${storageErrors.state}. Using defaults.`, 'error');
    }
  }, [storageErrors?.state, showToast]);

  // Auto-save debounced. Skipped until the user has taken an action.
  useEffect(() => {
    if (!hydrated || !dirtyRef.current) return;
    const handle = setTimeout(() => {
      saveState({startDate, endDate, mode, includeWorkingDays});
    }, STATE_AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [hydrated, startDate, endDate, mode, includeWorkingDays, saveState]);

  // In Age mode, the effective end date defaults to today when blank.
  const effectiveEndDate =
    mode === MODES.AGE && endDate === '' ? today : endDate;

  const computed = useMemo(() => {
    const start = parseISODate(startDate);
    const end = parseISODate(effectiveEndDate);
    if (!start || !end) return null;
    const ordered = swapIfReversed(start, end);
    const ymd = diffYMD(ordered.start, ordered.end);
    const units = totalUnits(ordered.start, ordered.end);
    const working = includeWorkingDays
      ? workingDaysBetween(ordered.start, ordered.end)
      : null;
    return {
      ymd,
      units,
      working,
      swapped: ordered.swapped,
    };
  }, [startDate, effectiveEndDate, includeWorkingDays]);

  const handleStartChange = (e) => {
    dirtyRef.current = true;
    setStartDate(e.target.value);
  };

  const handleEndChange = (e) => {
    dirtyRef.current = true;
    setEndDate(e.target.value);
  };

  const handleModeChange = (next) => {
    dirtyRef.current = true;
    setMode(next);
  };

  const handleWorkingToggle = (e) => {
    dirtyRef.current = true;
    setIncludeWorkingDays(e.target.checked);
  };

  const handleClear = () => {
    // Synchronous wipe + dirty=false so the post-Clear auto-save effect tick
    // skips and no phantom record is written 300 ms later.
    clearState();
    setStartDate('');
    setEndDate('');
    setMode(DEFAULT_STATE.mode);
    setIncludeWorkingDays(DEFAULT_STATE.includeWorkingDays);
    dirtyRef.current = false;
    showToast('Cleared', 'success');
  };

  const canClear =
    startDate !== '' ||
    endDate !== '' ||
    mode !== DEFAULT_STATE.mode ||
    includeWorkingDays !== DEFAULT_STATE.includeWorkingDays;

  const startLabel = mode === MODES.AGE ? 'Birth date (or any past date)' : 'Start date';
  const endLabel = mode === MODES.AGE ? 'On date (defaults to today)' : 'End date';

  return (
    <ToolPage
      title="Date Calculator"
      tagline="Find the difference between two dates, or your age from a date — in years, months, days, weeks, hours, and working days. Calculated locally in your browser."
      schema={SCHEMA}
      schemaId="date-calculator-schema"
      errorMessage="There was an error loading the date calculator. Please refresh the page."
    >
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="dc-stack">
        <Card>
          <div className="dc-mode-row">
            <ModeToggle
              ariaLabel="Calculation mode"
              ariaDescribedBy="dc-mode-hint"
              options={MODE_OPTIONS}
              value={mode}
              onChange={handleModeChange}
            />
            <p id="dc-mode-hint" className="dc-mode-hint">
              {mode === MODES.AGE
                ? 'Pick a birth date — the second field defaults to today, edit it for "age at a future date".'
                : 'Pick any two dates. If the end is before the start we swap them and show the absolute difference.'}
            </p>
          </div>
        </Card>

        <Card>
          <div className="dc-fields">
            <div className="dc-field">
              <label className="dc-field-label" htmlFor="dc-start">
                {startLabel}
              </label>
              <input
                id="dc-start"
                type="date"
                className="dc-date-input"
                value={startDate}
                onChange={handleStartChange}
              />
            </div>
            <div className="dc-field">
              <label className="dc-field-label" htmlFor="dc-end">
                {endLabel}
              </label>
              <input
                id="dc-end"
                type="date"
                className="dc-date-input"
                value={effectiveEndDate}
                onChange={handleEndChange}
              />
            </div>
          </div>

          <div className="dc-options-row">
            <label className="dc-toggle">
              <input
                type="checkbox"
                checked={includeWorkingDays}
                onChange={handleWorkingToggle}
              />
              Working days only (Mon–Fri)
            </label>
            <div className="dc-actions">
              <Button
                variant="neutral"
                onClick={handleClear}
                disabled={!canClear}
              >
                Clear
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="dc-result" aria-live="polite">
            {computed ? (
              <>
                <p className="dc-result-headline">{formatYMD(computed.ymd)}</p>

                {computed.swapped && (
                  <p className="dc-result-note">
                    End date was before start; showing absolute difference.
                  </p>
                )}

                <ul className="dc-units-list">
                  <li>
                    <span className="dc-unit-label">Total days</span>
                    <span className="dc-unit-value">
                      {computed.units.days.toLocaleString()}
                    </span>
                  </li>
                  <li>
                    <span className="dc-unit-label">Total weeks</span>
                    <span className="dc-unit-value">
                      {computed.units.weeks.toLocaleString()}
                      {computed.units.weekRemainderDays > 0
                        ? ` + ${computed.units.weekRemainderDays} day${
                            computed.units.weekRemainderDays === 1 ? '' : 's'
                          }`
                        : ''}
                    </span>
                  </li>
                  <li>
                    <span className="dc-unit-label">Total hours</span>
                    <span className="dc-unit-value">
                      {computed.units.hours.toLocaleString()}
                    </span>
                  </li>
                  <li>
                    <span className="dc-unit-label">Total minutes</span>
                    <span className="dc-unit-value">
                      {computed.units.minutes.toLocaleString()}
                    </span>
                  </li>
                  {computed.working !== null && (
                    <li>
                      <span className="dc-unit-label">Working days</span>
                      <span className="dc-unit-value">
                        {computed.working.toLocaleString()}
                      </span>
                    </li>
                  )}
                </ul>

                <p className="dc-result-footnote">
                  Calculated in your local time zone.
                </p>
              </>
            ) : (
              <p className="dc-result-empty">Pick two dates to see the breakdown.</p>
            )}
          </div>
        </Card>
      </div>
    </ToolPage>
  );
}

export default function DateCalculator() {
  return (
    <StorageProvider>
      <DateCalculatorContent />
    </StorageProvider>
  );
}

// Exported for tests.
export {STORAGE_KEY};
