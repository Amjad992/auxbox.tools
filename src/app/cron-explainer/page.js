'use client';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {DateTime} from 'luxon';
import ToolPage from '../../components/ToolPage';
import Card from '../../components/Card';
import ToastContainer from '../../components/ToastContainer';
import {useToast} from '../../hooks/useToast';
import {StorageProvider, useStorageData} from './StorageContext';
import {
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
  const [hydrated, setHydrated] = useState(false);
  const [zoneName, setZoneName] = useState('');
  const dirtyRef = useRef(false);

  // Hydrate once from storage.
  useEffect(() => {
    const saved = loadState();
    if (saved && typeof saved === 'object' && typeof saved.expression === 'string') {
      setExpression(saved.expression);
    }
    setHydrated(true);
    // Read the local zone after mount — this is a client-only value.
    setZoneName(DateTime.now().zoneName || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (storageErrors?.state) {
      showToast(`${storageErrors.state}. Using defaults.`, 'error');
    }
  }, [storageErrors?.state, showToast]);

  // Debounced auto-save. Skipped until the user has actually changed the
  // input (dirtyRef pattern — guards against the markdown-preview MAJ-2
  // phantom-write on Clear/Reset).
  useEffect(() => {
    if (!hydrated || !dirtyRef.current) return;
    const handle = setTimeout(() => {
      saveState({expression});
    }, STATE_AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [hydrated, expression, saveState]);

  const handleChange = useCallback((e) => {
    dirtyRef.current = true;
    setExpression(e.target.value);
  }, []);

  const handlePreset = useCallback((expr) => {
    dirtyRef.current = true;
    setExpression(expr);
  }, []);

  // Parse / describe / next-run derivations.
  const parseResult = useMemo(() => parseExpression(expression), [expression]);
  const description = useMemo(
    () => (parseResult.valid ? describe(expression) : null),
    [expression, parseResult.valid]
  );
  // `nextRuns` is non-deterministic by definition (it depends on "now").
  // Recompute on every render — it's cheap and the hook deps would have to
  // include a live clock anyway.
  const runs = parseResult.valid
    ? nextRuns(expression, NEXT_RUNS_COUNT)
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

      <div className="ce-stack">
        <Card>
          <label htmlFor="ce-expression" className="ce-input-label">
            Cron expression
          </label>
          <input
            id="ce-expression"
            type="text"
            className={`ce-input${showError ? ' ce-input--error' : ''}`}
            placeholder="e.g. 0 9 * * 1-5"
            value={expression}
            onChange={handleChange}
            aria-invalid={showError ? 'true' : 'false'}
            aria-describedby="ce-helper"
            autoComplete="off"
            spellCheck={false}
          />
          <p
            id="ce-helper"
            className={`ce-helper${showError ? ' ce-helper--error' : ''}`}
            role={showError ? 'alert' : undefined}
          >
            {showError
              ? `Cron expression is invalid: ${parseResult.error}`
              : 'Standard 5-field cron syntax: minute hour day-of-month month day-of-week.'}
          </p>

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
