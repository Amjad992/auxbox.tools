'use client';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {DateTime} from 'luxon';
import ToolPage from '../../components/ToolPage';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ModeToggle from '../../components/ModeToggle';
import DatePicker from '../../components/DatePicker';
import ResultCard from '../../components/ResultCard';
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
  swapIfReversed,
  totalUnits,
  totalWorkingUnits,
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

function todayDT() {
  return DateTime.now().startOf('day');
}

// Serialise a nullable DateTime to ISO date string for storage.
function serializeDate(dt) {
  return dt?.isValid ? dt.toISODate() : null;
}

// Deserialise a nullable ISO string from storage to DateTime or null.
function deserializeDate(str) {
  if (typeof str !== 'string' || str === '') return null;
  const dt = DateTime.fromISO(str).startOf('day');
  return dt.isValid ? dt : null;
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

  // DateTime | null for each date.
  const [startDate, setStartDate] = useState(null);
  // End date defaults to today on mount (overridden by persisted state if available).
  const [endDate, setEndDate] = useState(() => todayDT());
  const [mode, setMode] = useState(MODES.DIFFERENCE);
  const [includeWorkingDays, setIncludeWorkingDays] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const dirtyRef = useRef(false);

  // Hydrate once on mount.
  useEffect(() => {
    const saved = loadState();
    if (saved && typeof saved === 'object') {
      // startDate: null when not saved or empty string.
      const savedStart = deserializeDate(saved.startDate);
      const savedEnd = deserializeDate(saved.endDate);
      setStartDate(savedStart);
      // Honour the persisted value unconditionally; null IS a valid restored state.
      setEndDate(savedEnd);
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

  useEffect(() => {
    if (storageErrors?.state) {
      showToast(`${storageErrors.state}. Using defaults.`, 'error');
    }
  }, [storageErrors?.state, showToast]);

  // Auto-save debounced. Skipped until the user has taken an action.
  useEffect(() => {
    if (!hydrated || !dirtyRef.current) return;
    const handle = setTimeout(() => {
      saveState({
        startDate: serializeDate(startDate),
        endDate: serializeDate(endDate),
        mode,
        includeWorkingDays,
      });
    }, STATE_AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [hydrated, startDate, endDate, mode, includeWorkingDays, saveState]);

  // In Age mode, end date stays as-is but defaults to today when null.
  const effectiveEndDate =
    mode === MODES.AGE && endDate === null ? todayDT() : endDate;

  const computed = useMemo(() => {
    if (!startDate || !effectiveEndDate) return null;
    const ordered = swapIfReversed(startDate, effectiveEndDate);
    const ymd = diffYMD(ordered.start, ordered.end);
    const units = totalUnits(ordered.start, ordered.end);
    const workingUnits = includeWorkingDays
      ? totalWorkingUnits(workingDaysBetween(ordered.start, ordered.end))
      : null;
    return {ymd, units, workingUnits, swapped: ordered.swapped};
  }, [startDate, effectiveEndDate, includeWorkingDays]);

  const handleStartChange = useCallback((dt) => {
    dirtyRef.current = true;
    setStartDate(dt);
  }, []);

  const handleEndChange = useCallback((dt) => {
    dirtyRef.current = true;
    setEndDate(dt);
  }, []);

  const handleStartToday = useCallback(() => {
    dirtyRef.current = true;
    setStartDate(todayDT());
  }, []);

  const handleEndToday = useCallback(() => {
    dirtyRef.current = true;
    setEndDate(todayDT());
  }, []);

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
    setStartDate(null);
    setEndDate(todayDT());
    setMode(DEFAULT_STATE.mode);
    setIncludeWorkingDays(DEFAULT_STATE.includeWorkingDays);
    dirtyRef.current = false;
    showToast('Cleared', 'success');
  };

  // canClear: true if anything differs from fresh state (start null, end today, default mode, no working days).
  const today = todayDT();
  const endIsToday = endDate?.isValid && endDate.toISODate() === today.toISODate();
  const canClear =
    startDate !== null ||
    !endIsToday ||
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
              <DatePicker
                id="dc-start"
                label={startLabel}
                value={startDate}
                onChange={handleStartChange}
              />
              <Button variant="neutral" onClick={handleStartToday} className="dc-today-btn">
                Today
              </Button>
            </div>
            <div className="dc-field">
              <DatePicker
                id="dc-end"
                label={endLabel}
                value={effectiveEndDate}
                onChange={handleEndChange}
              />
              <Button variant="neutral" onClick={handleEndToday} className="dc-today-btn">
                Today
              </Button>
            </div>
          </div>

          <div className="dc-options-row">
            <label className="dc-toggle">
              <input
                type="checkbox"
                checked={includeWorkingDays}
                onChange={handleWorkingToggle}
              />
              Working days only (Mon–Fri · 8 hrs/day)
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

                <div className="tool-results-grid">
                  <ResultCard
                    label="Total days"
                    value={computed.units.days.toLocaleString()}
                  />
                  <ResultCard
                    label="Total weeks"
                    value={
                      computed.units.weeks.toLocaleString() +
                      (computed.units.weekRemainderDays > 0
                        ? ` + ${computed.units.weekRemainderDays} day${
                            computed.units.weekRemainderDays === 1 ? '' : 's'
                          }`
                        : '')
                    }
                  />
                  <ResultCard
                    label="Total hours"
                    value={computed.units.hours.toLocaleString()}
                  />
                  <ResultCard
                    label="Total minutes"
                    value={computed.units.minutes.toLocaleString()}
                  />
                </div>

                {computed.workingUnits !== null && (
                  <div className="tool-results-grid">
                    <ResultCard
                      label="Total working days"
                      value={computed.workingUnits.workingDays.toLocaleString()}
                    />
                    <ResultCard
                      label="Total working hours"
                      value={computed.workingUnits.workingHours.toLocaleString()}
                    />
                    <ResultCard
                      label="Total working minutes"
                      value={computed.workingUnits.workingMinutes.toLocaleString()}
                    />
                  </div>
                )}

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
