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
import {useCopyToClipboard} from '../../hooks/useCopyToClipboard';
import {StorageProvider, useStorageData} from './StorageContext';
import {
  DEFAULT_STATE,
  DELIMITERS,
  DELIMITER_AUTO,
  DIRECTIONS,
  DIRECTION_OPTIONS,
  STATE_AUTOSAVE_DEBOUNCE_MS,
} from './constants';
import {csvToJson, detectDelimiter, jsonToCsv} from './utils';
import './csv-json-converter.css';

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'CSV ↔ JSON Converter',
  description:
    'Free CSV ↔ JSON converter. Runs entirely in your browser — no upload.',
  url: 'https://auxbox.tools/csv-json-converter',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Any',
  offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'},
};

function CsvJsonConverterContent() {
  const {toasts, showToast, dismissToast} = useToast();
  const {loadState, saveState, clearState, storageErrors} = useStorageData();

  const [direction, setDirection] = useState(DEFAULT_STATE.direction);
  const [delimiter, setDelimiter] = useState(DEFAULT_STATE.delimiter);
  const [hasHeader, setHasHeader] = useState(DEFAULT_STATE.hasHeader);
  const [inferTypes, setInferTypes] = useState(DEFAULT_STATE.inferTypes);
  const [prettyJson, setPrettyJson] = useState(DEFAULT_STATE.prettyJson);
  const [input, setInput] = useState('');

  const hydrated = useHydrateStorage(() => {
    const saved = loadState();
    if (saved && typeof saved === 'object') {
      setDirection(saved.direction);
      setDelimiter(saved.delimiter);
      setHasHeader(saved.hasHeader);
      setInferTypes(saved.inferTypes);
      setPrettyJson(saved.prettyJson);
    }
  });

  useEffect(() => {
    if (storageErrors?.state) {
      showToast(`${storageErrors.state}. Using defaults.`, 'error');
    }
  }, [storageErrors?.state, showToast]);

  const {markDirty, markClean} = useAutoSave({
    onSave: () =>
      saveState({direction, delimiter, hasHeader, inferTypes, prettyJson}),
    enabled: hydrated,
    deps: [direction, delimiter, hasHeader, inferTypes, prettyJson],
    debounceMs: STATE_AUTOSAVE_DEBOUNCE_MS,
  });

  // Compute output reactively from input + settings.
  const result = useMemo(() => {
    if (input.trim() === '') return {ok: true, output: '', detectedDelimiter: null};
    if (direction === DIRECTIONS.CSV_TO_JSON) {
      const r = csvToJson(input, {delimiter, hasHeader, inferTypes});
      if (!r.ok) return {ok: false, error: r.error || 'Invalid CSV.'};
      const indent = prettyJson ? 2 : 0;
      const output = JSON.stringify(r.value, null, indent);
      return {ok: true, output, detectedDelimiter: r.delimiter};
    }
    // JSON → CSV: delimiter "auto" doesn't make sense; fall back to comma.
    const outDelim = delimiter === DELIMITER_AUTO ? ',' : delimiter;
    const r = jsonToCsv(input, {delimiter: outDelim});
    if (!r.ok) return {ok: false, error: r.error};
    return {ok: true, output: r.output, detectedDelimiter: outDelim};
  }, [input, direction, delimiter, hasHeader, inferTypes, prettyJson]);

  const detectedDelimiterLabel = useMemo(() => {
    if (delimiter !== DELIMITER_AUTO || !result.detectedDelimiter) return null;
    const d = DELIMITERS.find((x) => x.value === result.detectedDelimiter);
    return d ? d.label : result.detectedDelimiter;
  }, [delimiter, result.detectedDelimiter]);

  const handleClear = () => {
    setInput('');
    clearState();
    setDirection(DEFAULT_STATE.direction);
    setDelimiter(DEFAULT_STATE.delimiter);
    setHasHeader(DEFAULT_STATE.hasHeader);
    setInferTypes(DEFAULT_STATE.inferTypes);
    setPrettyJson(DEFAULT_STATE.prettyJson);
    markClean();
    showToast('Cleared', 'success');
  };

  const handleSwap = () => {
    if (!result.ok || !result.output) return;
    setInput(result.output);
    setDirection(
      direction === DIRECTIONS.CSV_TO_JSON
        ? DIRECTIONS.JSON_TO_CSV
        : DIRECTIONS.CSV_TO_JSON
    );
    markDirty();
  };

  const copy = useCopyToClipboard({
    showToast,
    successMessage: 'Output copied',
  });

  const isCsvToJson = direction === DIRECTIONS.CSV_TO_JSON;

  return (
    <ToolPage
      title="CSV ↔ JSON Converter"
      tagline="Convert CSV to JSON or JSON to CSV. Auto-detects delimiter, optional type inference. Runs entirely in your browser."
      schema={SCHEMA}
      schemaId="csv-json-converter-schema"
      errorMessage="There was an error loading the CSV ↔ JSON converter. Please refresh the page."
    >
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="tool-stack">
        <Card>
          <h2 className="cjc-card-title">Direction</h2>
          <ModeToggle
            ariaLabel="Conversion direction"
            options={DIRECTION_OPTIONS}
            value={direction}
            onChange={(next) => {
              markDirty();
              setDirection(next);
            }}
          />
        </Card>

        <Card>
          <div className="cjc-controls">
            <div className="tool-field">
              <label htmlFor="cjc-delim" className="tool-field-label">
                Delimiter
              </label>
              <select
                id="cjc-delim"
                className="tool-select"
                value={delimiter}
                onChange={(e) => {
                  markDirty();
                  setDelimiter(e.target.value);
                }}
              >
                {DELIMITERS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="cjc-toggle-row">
              {isCsvToJson && (
                <>
                  <label className="cjc-toggle">
                    <input
                      type="checkbox"
                      checked={hasHeader}
                      onChange={(e) => {
                        markDirty();
                        setHasHeader(e.target.checked);
                      }}
                    />
                    First row is header
                  </label>
                  <label className="cjc-toggle">
                    <input
                      type="checkbox"
                      checked={inferTypes}
                      onChange={(e) => {
                        markDirty();
                        setInferTypes(e.target.checked);
                      }}
                    />
                    Infer types (numbers, booleans, null)
                  </label>
                  <label className="cjc-toggle">
                    <input
                      type="checkbox"
                      checked={prettyJson}
                      onChange={(e) => {
                        markDirty();
                        setPrettyJson(e.target.checked);
                      }}
                    />
                    Pretty-print JSON
                  </label>
                </>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="cjc-card-title">
            {isCsvToJson ? 'Input CSV' : 'Input JSON'}
          </h2>
          <textarea
            aria-label={isCsvToJson ? 'Input CSV' : 'Input JSON'}
            className="tool-textarea cjc-textarea-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isCsvToJson
                ? 'name,age\nAlice,30\nBob,25'
                : '[{"name":"Alice","age":30}]'
            }
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
          <div className="cjc-actions">
            <Button variant="neutral" onClick={handleClear}>
              Clear
            </Button>
          </div>
          {!result.ok && (
            <p className="cjc-error" role="alert">
              {result.error}
            </p>
          )}
          {result.ok && detectedDelimiterLabel && (
            <p className="cjc-hint" role="status" aria-live="polite">
              Detected delimiter: <code>{detectedDelimiterLabel}</code>
            </p>
          )}
        </Card>

        <Card>
          <h2 className="cjc-card-title">
            {isCsvToJson ? 'Output JSON' : 'Output CSV'}
          </h2>
          <textarea
            aria-label={isCsvToJson ? 'Output JSON' : 'Output CSV'}
            className="tool-textarea cjc-textarea-output"
            value={result.ok ? result.output : ''}
            readOnly
            placeholder={
              isCsvToJson
                ? 'Converted JSON will appear here.'
                : 'Converted CSV will appear here.'
            }
            spellCheck={false}
          />
          <div className="cjc-actions">
            <Button
              variant="primary"
              onClick={() => copy(result.ok ? result.output : '')}
              disabled={!result.ok || !result.output}
            >
              Copy
            </Button>
            <Button
              variant="neutral"
              onClick={handleSwap}
              disabled={!result.ok || !result.output}
              title="Move the output back into the input and flip direction"
            >
              ↑↓ Swap
            </Button>
          </div>
        </Card>
      </div>
    </ToolPage>
  );
}

export default function CsvJsonConverter() {
  return (
    <StorageProvider>
      <CsvJsonConverterContent />
    </StorageProvider>
  );
}
