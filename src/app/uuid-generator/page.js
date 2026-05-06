'use client';
import {useEffect, useMemo, useState} from 'react';
import ToolPage from '../../components/ToolPage';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Slider from '../../components/Slider';
import ToastContainer from '../../components/ToastContainer';
import {useToast} from '../../hooks/useToast';
import {useAutoSave} from '../../hooks/useAutoSave';
import {useHydrateStorage} from '../../hooks/useHydrateStorage';
import {useCopyToClipboard} from '../../hooks/useCopyToClipboard';
import {StorageProvider, useStorageData} from './StorageContext';
import {
  BOUNDS,
  COUNT_PRESETS,
  DEFAULT_STATE,
  STATE_AUTOSAVE_DEBOUNCE_MS,
  TYPES,
  TYPE_OPTIONS,
} from './constants';
import {generateBatch} from './utils';
import './uuid-generator.css';

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'UUID Generator',
  description:
    'Free UUID generator. Generate UUID v4 (random) or UUID v7 (timestamp-ordered) in bulk. Browser-only.',
  url: 'https://auxbox.tools/uuid-generator',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Any',
  offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'},
};

function UuidGeneratorContent() {
  const {toasts, showToast, dismissToast} = useToast();
  const {loadState, saveState, clearState, storageErrors} = useStorageData();

  const [type, setType] = useState(DEFAULT_STATE.type);
  const [count, setCount] = useState(DEFAULT_STATE.count);
  const [uuids, setUuids] = useState([]);

  const hydrated = useHydrateStorage(() => {
    const saved = loadState();
    if (saved && typeof saved === 'object') {
      if (typeof saved.type === 'string') setType(saved.type);
      if (typeof saved.count === 'number') setCount(saved.count);
    }
  });

  useEffect(() => {
    if (storageErrors?.state) {
      showToast(`${storageErrors.state}. Using defaults.`, 'error');
    }
  }, [storageErrors?.state, showToast]);

  const {markDirty, markClean} = useAutoSave({
    onSave: () => saveState({type, count}),
    enabled: hydrated,
    deps: [type, count],
    debounceMs: STATE_AUTOSAVE_DEBOUNCE_MS,
  });

  const handleGenerate = () => {
    setUuids(generateBatch(type, count));
  };

  const handleClear = () => {
    setUuids([]);
    clearState();
    setType(DEFAULT_STATE.type);
    setCount(DEFAULT_STATE.count);
    markClean();
    showToast('Cleared', 'success');
  };

  const handleType = (next) => {
    markDirty();
    setType(next);
    // Wipe the previous batch — its IDs are the wrong version.
    setUuids([]);
  };

  const handleCount = (next) => {
    markDirty();
    setCount(next);
  };

  const copy = useCopyToClipboard({
    showToast,
    successMessage: 'Copied',
  });

  const handleDownload = () => {
    if (uuids.length === 0) return;
    const blob = new Blob([uuids.join('\n') + '\n'], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uuids-${type}-${new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, 19)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Downloaded', 'success');
  };

  const allText = useMemo(() => uuids.join('\n'), [uuids]);

  return (
    <ToolPage
      title="UUID Generator"
      tagline="Generate UUID v4 (random) or UUID v7 (timestamp-ordered) in bulk. Per-row copy, copy-all, download .txt. Runs entirely in your browser."
      schema={SCHEMA}
      schemaId="uuid-generator-schema"
      errorMessage="There was an error loading the UUID generator. Please refresh the page."
    >
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="tool-stack">
        <Card>
          <h2 className="ug-card-title">Type</h2>
          <fieldset className="ug-types">
            <legend className="tool-sr-only">UUID type</legend>
            {TYPE_OPTIONS.map((opt) => {
              const active = type === opt.value;
              const hint =
                opt.value === TYPES.V4
                  ? '128 random bits. The everyday default — collision-resistant, no ordering guarantee.'
                  : 'Unix-ms timestamp + random tail. Lexicographically ordered → great as a database primary key.';
              return (
                <label
                  key={opt.value}
                  className={`ug-type${active ? ' ug-type--active' : ''}`}
                >
                  <input
                    type="radio"
                    name="ug-type"
                    value={opt.value}
                    checked={active}
                    onChange={() => handleType(opt.value)}
                  />
                  <span>
                    <span className="ug-type-label">{opt.label}</span>
                    <span className="ug-type-hint">
                      <br />
                      {hint}
                    </span>
                  </span>
                </label>
              );
            })}
          </fieldset>
        </Card>

        <Card>
          <h2 className="ug-card-title">How many?</h2>
          <Slider
            id="ug-count"
            label="Count"
            value={count}
            min={BOUNDS.COUNT_MIN}
            max={BOUNDS.COUNT_MAX}
            step={1}
            integerOnly
            onChange={handleCount}
            formatValue={(v) => `${v}`}
            leftHint={`${BOUNDS.COUNT_MIN}`}
            rightHint={`${BOUNDS.COUNT_MAX}`}
          />
          <div className="tool-presets">
            {COUNT_PRESETS.map((p) => {
              const active = count === p;
              return (
                <button
                  type="button"
                  key={p}
                  className={`tool-preset${active ? ' tool-preset--active' : ''}`}
                  onClick={() => handleCount(p)}
                  aria-pressed={active}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </Card>

        <div className="ug-actions">
          <Button variant="primary" onClick={handleGenerate}>
            Generate
          </Button>
          <Button
            variant="neutral"
            onClick={() => copy(allText)}
            disabled={uuids.length === 0}
          >
            Copy all
          </Button>
          <Button
            variant="neutral"
            onClick={handleDownload}
            disabled={uuids.length === 0}
          >
            Download .txt
          </Button>
          <Button variant="neutral" onClick={handleClear}>
            Clear
          </Button>
        </div>

        <Card>
          <h2 className="ug-card-title">Result</h2>
          <div className="ug-list" aria-live="polite" aria-atomic="false">
            {uuids.length === 0 ? (
              <p className="ug-empty">
                Click <strong>Generate</strong> to create {count}{' '}
                {type.toUpperCase()} {count === 1 ? 'UUID' : 'UUIDs'}.
              </p>
            ) : (
              uuids.map((id, i) => (
                <div key={`${i}-${id}`} className="ug-row">
                  <span className="ug-row-index">{i + 1}</span>
                  <code className="ug-row-uuid">{id}</code>
                  <Button variant="neutral" onClick={() => copy(id)}>
                    Copy
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </ToolPage>
  );
}

export default function UuidGenerator() {
  return (
    <StorageProvider>
      <UuidGeneratorContent />
    </StorageProvider>
  );
}
