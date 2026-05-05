'use client';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {DateTime} from 'luxon';
import ToolPage from '../../components/ToolPage';
import Card from '../../components/Card';
import InputField from '../../components/InputField';
import ToastContainer from '../../components/ToastContainer';
import {useToast} from '../../hooks/useToast';
import {useAutoSave} from '../../hooks/useAutoSave';
import {useHydrateStorage} from '../../hooks/useHydrateStorage';
import {StorageProvider, useStorageData} from './StorageContext';
import {
  MAX_PERSISTED_CHARS,
  NEXT_RUNS_COUNT,
  PRESETS,
  STATE_AUTOSAVE_DEBOUNCE_MS,
  STORAGE_KEY,
} from './constants';
import {describe, nextRuns, parseExpression} from './utils';
import './cron-explainer.css';

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Cron Expression Explainer',
  description:
    'Free online cron expression decoder. Paste any cron expression and see a plain-English description and the next 5 fire times in your local time zone.',
  url: 'https://auxbox.tools/cron-explainer',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Any',
  offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'},
};

function CronExplainerContent() {
  const {toasts, showToast, dismissToast} = useToast();
  const {loadState, saveState, storageErrors} = useStorageData();

  const [expression, setExpression] = useState('');
  const [zoneName, setZoneName] = useState('');
  const [now, setNow] = useState(() => DateTime.now().toJSDate());

  // Hydrate once from storage.
  const hydrated = useHydrateStorage(() => {
    const saved = loadState();
    if (saved && typeof saved === 'object' && typeof saved.expression === 'string') {
      setExpression(saved.expression);
    }
    // Read the local zone after mount — this is a client-only value.
    setZoneName(DateTime.now().zoneName || '');
  });

  useEffect(() => {
    if (storageErrors?.state) {
      showToast(`${storageErrors.state}. Using defaults.`, 'error');
    }
  }, [storageErrors?.state, showToast]);

  // Refresh relative time labels every 60 s so "in 2 days" stays accurate
  // on an idle tab without requiring a page reload.
  useEffect(() => {
    const id = setInterval(() => setNow(DateTime.now().toJSDate()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Debounced auto-save. Skipped until the user has actually changed the
  // input (markdown-preview MAJ-2 phantom-write guard) and over the size
  // cap (mirrors markdown-preview's autosave gate).
  const {markDirty} = useAutoSave({
    enabled: hydrated && expression.length <= MAX_PERSISTED_CHARS,
    deps: [expression],
    onSave: () => saveState({expression}),
    debounceMs: STATE_AUTOSAVE_DEBOUNCE_MS,
  });

  const handleChange = useCallback((e) => {
    markDirty();
    setExpression(e.target.value);
  }, [markDirty]);

  const handlePreset = useCallback((expr) => {
    markDirty();
    setExpression(expr);
  }, [markDirty]);

  // Parse / describe / next-run derivations.
  const parseResult = useMemo(() => parseExpression(expression), [expression]);
  const description = useMemo(
    () => (parseResult.valid ? describe(expression) : null),
    [expression, parseResult.valid]
  );
  // `nextRuns` is non-deterministic by definition (it depends on "now").
  // Pass the `now` state (refreshed every 60 s) so relative time labels stay
  // accurate on an idle tab.
  const runs = parseResult.valid
    ? nextRuns(expression, NEXT_RUNS_COUNT, now)
    : [];

  const trimmed = expression.trim();
  const showError = trimmed.length > 0 && !parseResult.valid;

  return (
    <ToolPage
      title="Cron Expression Explainer"
      tagline="Paste a cron expression — get a plain-English description and the next 5 fire times in your local time zone."
      schema={SCHEMA}
      schemaId="cron-explainer-schema"
      narrow
      errorMessage="There was an error loading the Cron Explainer. Please refresh the page."
    >
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="tool-stack">
        <Card>
          <InputField
            id="ce-expression"
            label="Cron expression"
            type="text"
            placeholder="e.g. 0 9 * * 1-5"
            value={expression}
            onChange={handleChange}
            autoComplete="off"
            spellCheck={false}
            error={showError ? parseResult.error : undefined}
            helper="Standard 5-field cron syntax: minute hour day-of-month month day-of-week."
            className="ce-field"
            inputClassName={`ce-input${showError ? ' ce-input--error' : ''}`}
          />

          <span id="ce-presets-label" className="ce-presets-label">Presets</span>
          <div
            className="ce-preset-row"
            role="group"
            aria-labelledby="ce-presets-label"
          >
            {PRESETS.map((p) => (
              <button
                key={p.expression}
                type="button"
                className="ce-preset"
                onClick={() => handlePreset(p.expression)}
                aria-label={`Use preset: ${p.label} (${p.expression})`}
              >
                <span className="ce-preset-expr">{p.expression}</span>
                {p.label}
              </button>
            ))}
          </div>
        </Card>

        <div
          role="region"
          aria-label="Cron expression results"
          aria-live="polite"
          aria-atomic="false"
          data-testid="ce-results-region"
        >
          {description && (
            <Card>
              <p className="ce-description" data-testid="ce-description">
                {description}
              </p>
            </Card>
          )}

          {runs.length > 0 && (
            <Card>
              <h2 className="ce-runs-title">Next {runs.length} runs</h2>
              <ol className="ce-runs-list" aria-label="Upcoming fire times">
                {runs.map((r) => (
                  <li key={r.isoString} className="ce-run">
                    <span className="ce-run-absolute">{r.absoluteLabel}</span>
                    {r.relativeLabel && (
                      <span className="ce-run-relative">{r.relativeLabel}</span>
                    )}
                  </li>
                ))}
              </ol>
              {zoneName && (
                <p className="ce-zone-note" data-testid="ce-zone-note">
                  Times shown in your local time zone ({zoneName}).
                </p>
              )}
            </Card>
          )}
        </div>
      </div>
    </ToolPage>
  );
}

export default function CronExplainer() {
  return (
    <StorageProvider>
      <CronExplainerContent />
    </StorageProvider>
  );
}

// Exported for tests.
export {STORAGE_KEY};
