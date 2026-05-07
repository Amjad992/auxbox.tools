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
  INDENT_OPTIONS,
  MODES,
  MODE_OPTIONS,
  STATE_AUTOSAVE_DEBOUNCE_MS,
} from './constants';
import {formatJson, minifyJson, validateJson} from './utils';
import './json-formatter.css';

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'JSON Formatter & Validator',
  description:
    'Free JSON formatter and validator. Pretty-print, minify, or validate JSON entirely in your browser.',
  url: 'https://auxbox.tools/json-formatter',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Any',
  offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'},
};

function JsonFormatterContent() {
  const {toasts, showToast, dismissToast} = useToast();
  const {loadState, saveState, clearState, storageErrors} = useStorageData();

  const [mode, setMode] = useState(DEFAULT_STATE.mode);
  const [indent, setIndent] = useState(DEFAULT_STATE.indent);
  const [sortKeys, setSortKeys] = useState(DEFAULT_STATE.sortKeys);
  const [liveFormat, setLiveFormat] = useState(DEFAULT_STATE.liveFormat);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState(null);
  // Sentinel for Validate mode — tracks whether the last validation passed.
  const [valid, setValid] = useState(false);

  const hydrated = useHydrateStorage(() => {
    const saved = loadState();
    if (saved && typeof saved === 'object') {
      setMode(saved.mode);
      setIndent(saved.indent);
      setSortKeys(saved.sortKeys);
      setLiveFormat(saved.liveFormat);
    }
  });

  useEffect(() => {
    if (storageErrors?.state) {
      showToast(`${storageErrors.state}. Using defaults.`, 'error');
    }
  }, [storageErrors?.state, showToast]);

  const {markDirty, markClean} = useAutoSave({
    onSave: () => saveState({mode, indent, sortKeys, liveFormat}),
    enabled: hydrated,
    deps: [mode, indent, sortKeys, liveFormat],
    debounceMs: STATE_AUTOSAVE_DEBOUNCE_MS,
  });

  const compute = (text) => {
    if (text.trim() === '') {
      setOutput('');
      setError(null);
      setValid(false);
      return;
    }
    if (mode === MODES.VALIDATE) {
      const r = validateJson(text);
      setOutput('');
      if (r.ok) {
        setError(null);
        setValid(true);
      } else {
        setError({message: r.error, line: r.line, column: r.column});
        setValid(false);
      }
      return;
    }
    const r =
      mode === MODES.MINIFY
        ? minifyJson(text, {sortKeys})
        : formatJson(text, {indent, sortKeys});
    if (r.ok) {
      setOutput(r.output);
      setError(null);
      setValid(false);
    } else {
      setOutput('');
      setError({
        message: r.error,
        line: r.line,
        column: r.column,
      });
      setValid(false);
    }
  };

  // Re-run on input or option change when live mode is on. Debounced to
  // avoid main-thread jank on large inputs and screen-reader spam mid-typing.
  useEffect(() => {
    if (!liveFormat) return undefined;
    const handle = setTimeout(() => compute(input), 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, mode, indent, sortKeys, liveFormat]);

  const handleApply = () => {
    compute(input);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError(null);
    clearState();
    setMode(DEFAULT_STATE.mode);
    setIndent(DEFAULT_STATE.indent);
    setSortKeys(DEFAULT_STATE.sortKeys);
    setLiveFormat(DEFAULT_STATE.liveFormat);
    markClean();
    showToast('Cleared', 'success');
  };

  const handleSwap = () => {
    if (!output) return;
    setInput(output);
    setOutput('');
    setError(null);
  };

  const copy = useCopyToClipboard({
    showToast,
    successMessage: 'Output copied',
  });

  const errorLabel = useMemo(() => {
    if (!error) return null;
    if (error.line && error.column) {
      return `Line ${error.line}, column ${error.column}: ${error.message}`;
    }
    return error.message;
  }, [error]);

  const isValid = !error && (mode === MODES.VALIDATE ? valid : output !== '');

  return (
    <ToolPage
      title="JSON Formatter & Validator"
      tagline="Paste JSON to pretty-print, minify, or validate it. Sort keys alphabetically, pick the indent — runs entirely in your browser."
      schema={SCHEMA}
      schemaId="json-formatter-schema"
      errorMessage="There was an error loading the JSON formatter. Please refresh the page."
    >
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="tool-stack">
        <Card>
          <h2 className="tool-card-title">Mode</h2>
          <ModeToggle
            ariaLabel="Output mode"
            options={MODE_OPTIONS}
            value={mode}
            onChange={(next) => {
              markDirty();
              setMode(next);
            }}
          />
        </Card>

        <Card>
          <div className="jf-controls">
            {mode === MODES.FORMAT && (
              <div className="jf-control">
                <label htmlFor="jf-indent" className="tool-select-label">
                  Indent
                </label>
                <select
                  id="jf-indent"
                  className="tool-select"
                  value={indent}
                  onChange={(e) => {
                    markDirty();
                    setIndent(e.target.value);
                  }}
                >
                  {INDENT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="jf-toggle-row">
              <label className="jf-toggle">
                <input
                  type="checkbox"
                  checked={sortKeys}
                  onChange={(e) => {
                    markDirty();
                    setSortKeys(e.target.checked);
                  }}
                />
                Sort keys (numeric-aware)
              </label>
              <label className="jf-toggle">
                <input
                  type="checkbox"
                  checked={liveFormat}
                  onChange={(e) => {
                    markDirty();
                    setLiveFormat(e.target.checked);
                  }}
                />
                Live (re-run on input change)
              </label>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="tool-card-title">Input JSON</h2>
          <textarea
            aria-label="Input JSON"
            className="tool-textarea jf-textarea-input"
            value={input}
            // Input text is intentionally NOT persisted — privacy invariant.
            // Do not call markDirty() in setInput; only settings hit storage.
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"hello":"world"}'
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
          <div className="jf-actions">
            {!liveFormat && (
              <Button variant="primary" onClick={handleApply}>
                {mode === MODES.MINIFY
                  ? 'Minify'
                  : mode === MODES.VALIDATE
                    ? 'Validate'
                    : 'Format'}
              </Button>
            )}
            <Button variant="neutral" onClick={handleClear}>
              Clear
            </Button>
          </div>
          {errorLabel && (
            <p className="tool-error" role="alert">
              {errorLabel}
            </p>
          )}
          {!error && input.trim() !== '' && isValid && (
            <p className="jf-success" role="status" aria-live="polite">
              Valid JSON.
            </p>
          )}
        </Card>

        {mode !== MODES.VALIDATE && (
          <Card>
            <h2 className="tool-card-title">Output</h2>
            <textarea
              aria-label="Output JSON"
              className="tool-textarea jf-textarea-output"
              value={output}
              readOnly
              placeholder="Pretty-printed or minified JSON will appear here."
              spellCheck={false}
            />
            <div className="jf-actions">
              <Button
                variant="primary"
                onClick={() => copy(output)}
                disabled={!output}
              >
                Copy
              </Button>
              <Button
                variant="neutral"
                onClick={handleSwap}
                disabled={!output}
                title="Move the output back into the input"
              >
                ↑ Use as input
              </Button>
            </div>
          </Card>
        )}
      </div>
    </ToolPage>
  );
}

export default function JsonFormatter() {
  return (
    <StorageProvider>
      <JsonFormatterContent />
    </StorageProvider>
  );
}
