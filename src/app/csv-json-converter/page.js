'use client';
import {useEffect, useState} from 'react';
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
import {csvToJson, jsonToCsv} from './utils';
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
  const [result, setResult] = useState({ok: true, output: '', detectedDelimiter: null});

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

  // Debounced reactive computation — 300 ms to avoid main-thread jank mid-typing.
  useEffect(() => {
    const handle = setTimeout(() => {
      if (input.trim() === '') {
        setResult({ok: true, output: '', detectedDelimiter: null});
        return;
      }
      if (direction === DIRECTIONS.CSV_TO_JSON) {
        const r = csvToJson(input, {delimiter, hasHeader, inferTypes});
        if (!r.ok) {
          setResult({ok: false, error: r.error || 'Invalid CSV.'});
          return;
        }
        const indent = prettyJson ? 2 : 0;
        const output = JSON.stringify(r.value, null, indent);
        setResult({
          ok: true,
          output,
          detectedDelimiter: r.delimiter,
          warnings: r.warnings,
        });
        return;
      }
      // JSON → CSV: delimiter "auto" doesn't make sense; fall back to comma.
      const outDelim = delimiter === DELIMITER_AUTO ? ',' : delimiter;
      const r = jsonToCsv(input, {delimiter: outDelim});
      if (!r.ok) {
        const errMsg =
          r.line && r.column
            ? `Line ${r.line}, column ${r.column}: ${r.error}`
            : r.error;
        setResult({ok: false, error: errMsg});
        return;
      }
      setResult({ok: true, output: r.output, detectedDelimiter: null, warnings: r.warnings});
    }, 300);
    return () => clearTimeout(handle);
  }, [input, direction, delimiter, hasHeader, inferTypes, prettyJson]);

  const detectedDelimiterLabel = (() => {
    if (direction !== DIRECTIONS.CSV_TO_JSON) return null;
    if (delimiter !== DELIMITER_AUTO || !result.detectedDelimiter) return null;
    const d = DELIMITERS.find((x) => x.value === result.detectedDelimiter);
    return d ? d.label : result.detectedDelimiter;
  })();

  const handleClear = () => {
    setInput('');
    clearState();
    setDirection(DEFAULT_STATE.direction);
    setDelimiter(DEFAULT_STATE.delimiter);
    setHasHeader(DEFAULT_STATE.hasHeader);
    setInferTypes(DEFAULT_STATE.inferTypes);
    setPrettyJson(DEFAULT_STATE.prettyJson);
    setResult({ok: true, output: '', detectedDelimiter: null});
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
    showToast('Swapped — input replaced with previous output', 'success');
  };

  const copy = useCopyToClipboard({
    showToast,
    successMessage: 'Output copied',
  });

  const isCsvToJson = direction === DIRECTIONS.CSV_TO_JSON;

  // When switching to JSON→CSV, coerce "auto" to comma so the select
  // doesn't point at a filtered-out option.
  const handleDirectionChange = (next) => {
    markDirty();
    setDirection(next);
    if (next === DIRECTIONS.JSON_TO_CSV && delimiter === DELIMITER_AUTO) {
      setDelimiter(',');
    }
  };

  const visibleDelimiters = isCsvToJson
    ? DELIMITERS
    : DELIMITERS.filter((d) => d.value !== DELIMITER_AUTO);

  const warnings = result.warnings ?? [];

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
          <h2 className="tool-card-title">Direction</h2>
          <ModeToggle
            ariaLabel="Conversion direction"
            options={DIRECTION_OPTIONS}
            value={direction}
            onChange={handleDirectionChange}
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
                {visibleDelimiters.map((d) => (
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
          <h2 className="tool-card-title">
            {isCsvToJson ? 'Input CSV' : 'Input JSON'}
          </h2>
          <textarea
            aria-label={isCsvToJson ? 'Input CSV' : 'Input JSON'}
            className="tool-textarea cjc-textarea-input"
            value={input}
            // Input text is intentionally NOT persisted — privacy invariant.
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
            <p className="tool-error" role="alert">
              {result.error}
            </p>
          )}
          {result.ok && detectedDelimiterLabel && (
            <p className="tool-hint" role="status" aria-live="polite">
              Detected delimiter: <code>{detectedDelimiterLabel}</code>
            </p>
          )}
          {result.ok && warnings.map((w, i) => (
            <p key={i} className="tool-hint" role="status" aria-live="polite">
              {w}
            </p>
          ))}
        </Card>

        <Card>
          <h2 className="tool-card-title">
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
