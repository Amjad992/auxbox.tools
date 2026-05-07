'use client';
import {useEffect, useMemo, useRef, useState} from 'react';
import {DateTime} from 'luxon';
import ToolPage from '../../components/ToolPage';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ToastContainer from '../../components/ToastContainer';
import {useToast} from '../../hooks/useToast';
import {useAutoSave} from '../../hooks/useAutoSave';
import {useHydrateStorage} from '../../hooks/useHydrateStorage';
import {useCopyToClipboard} from '../../hooks/useCopyToClipboard';
import {StorageProvider, useStorageData} from './StorageContext';
import {
  DEFAULT_STATE,
  STATE_AUTOSAVE_DEBOUNCE_MS,
  ZONE_OPTIONS,
} from './constants';
import {buildAllRepresentations, parseAny} from './utils';
import './timestamp-converter.css';

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Unix Timestamp Converter',
  description:
    'Convert between ISO 8601, Unix epoch (seconds and milliseconds), and human-readable local time. Browser-only.',
  url: 'https://auxbox.tools/timestamp-converter',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Any',
  offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'},
};

function TimestampConverterContent() {
  const {toasts, showToast, dismissToast} = useToast();
  const {loadState, saveState, clearState, storageErrors} = useStorageData();

  const [zone, setZone] = useState(DEFAULT_STATE.zone);
  const [iso, setIso] = useState('');
  const [seconds, setSeconds] = useState('');
  const [millis, setMillis] = useState('');
  const [human, setHuman] = useState('');
  const [error, setError] = useState(null);

  const hydrated = useHydrateStorage(() => {
    const saved = loadState();
    if (saved && typeof saved === 'object' && typeof saved.zone === 'string') {
      setZone(saved.zone);
    }
  });

  useEffect(() => {
    if (storageErrors?.state) {
      showToast(`${storageErrors.state}. Using defaults.`, 'error');
    }
  }, [storageErrors?.state, showToast]);

  const {markDirty, markClean} = useAutoSave({
    onSave: () => saveState({zone}),
    enabled: hydrated,
    deps: [zone],
    debounceMs: STATE_AUTOSAVE_DEBOUNCE_MS,
  });

  // Apply a parsed DateTime to all four fields. The field that the user
  // typed in is passed in `source` so we DON'T re-write it (avoids cursor
  // jump and keeps the user's exact in-progress text).
  const apply = (dt, source = null) => {
    if (!dt || !dt.isValid) {
      // Don't blank the others; leave whatever the previous valid value
      // was so the page doesn't visibly jump on every empty keystroke.
      return;
    }
    const r = buildAllRepresentations(dt, zone);
    if (source !== 'iso') setIso(r.iso);
    if (source !== 'seconds') setSeconds(r.seconds == null ? '' : String(r.seconds));
    if (source !== 'millis') setMillis(r.millis == null ? '' : String(r.millis));
    if (source !== 'human') setHuman(r.human);
    setError(null);
  };

  // Debounce timer for cross-field updates (S8).
  const debounceRef = useRef(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleField = (source, raw) => {
    // Update the source field immediately.
    if (source === 'iso') setIso(raw);
    if (source === 'seconds') setSeconds(raw);
    if (source === 'millis') setMillis(raw);
    if (source === 'human') setHuman(raw);

    // Cancel any pending debounced update.
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (raw.trim() === '') {
      // User is starting over — clear all other fields immediately (S3).
      if (source !== 'iso') setIso('');
      if (source !== 'seconds') setSeconds('');
      if (source !== 'millis') setMillis('');
      if (source !== 'human') setHuman('');
      setError(null);
      return;
    }

    // Debounce cross-field updates to avoid partial-keystroke thrash (S8).
    debounceRef.current = setTimeout(() => {
      const dt = parseAny(raw);
      if (dt) {
        apply(dt, source);
      } else {
        setError('Could not parse this value.');
      }
    }, 200);
  };

  const handleNow = () => {
    apply(DateTime.now());
    showToast('Set to now', 'success');
  };

  const handleClear = () => {
    setIso('');
    setSeconds('');
    setMillis('');
    setHuman('');
    setError(null);
    clearState();
    setZone(DEFAULT_STATE.zone);
    markClean();
    showToast('Cleared', 'success');
  };

  const handleZoneChange = (next) => {
    markDirty();
    setZone(next);
    // Re-render the existing instant in the new zone if any field has a value.
    // Prefer the most-precise non-empty source: millis → seconds → iso (S6).
    if (millis !== '' || seconds !== '' || iso !== '') {
      const source = millis !== '' ? millis : seconds !== '' ? seconds : iso;
      const dt = parseAny(source);
      if (dt) {
        // Use updated zone immediately. apply() reads `zone` from closure
        // which is still the old one, so manually rebuild here.
        const r = buildAllRepresentations(dt, next);
        setIso(r.iso);
        setSeconds(r.seconds == null ? '' : String(r.seconds));
        setMillis(r.millis == null ? '' : String(r.millis));
        setHuman(r.human);
      }
    }
  };

  const copy = useCopyToClipboard({
    showToast,
    successMessage: 'Copied',
  });

  const allText = useMemo(() => {
    if (!iso) return '';
    return `ISO: ${iso}\nSeconds: ${seconds}\nMillis: ${millis}\nHuman: ${human}`;
  }, [iso, seconds, millis, human]);

  const hasValue = iso !== '';

  return (
    <ToolPage
      title="Unix Timestamp Converter"
      tagline="Convert between ISO 8601, Unix epoch (seconds and milliseconds), and human-readable local time. Edit any field, the others update."
      schema={SCHEMA}
      schemaId="timestamp-converter-schema"
      errorMessage="There was an error loading the timestamp converter. Please refresh the page."
    >
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="tool-stack">
        <Card>
          <div className="tc-actions">
            <Button variant="primary" onClick={handleNow}>
              Now
            </Button>
            <Button
              variant="neutral"
              onClick={() => copy(allText)}
              disabled={!hasValue}
            >
              Copy all
            </Button>
            <Button variant="neutral" onClick={handleClear}>
              Clear
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="tc-card-title">Time zone</h2>
          <div className="tc-zone-row">
            <label htmlFor="tc-zone" className="tool-field-label">
              Zone
            </label>
            <select
              id="tc-zone"
              className="tool-select"
              value={zone}
              onChange={(e) => handleZoneChange(e.target.value)}
            >
              {ZONE_OPTIONS.map((z) => (
                <option key={z.value} value={z.value}>
                  {z.label}
                </option>
              ))}
            </select>
          </div>
        </Card>

        <Card>
          <h2 className="tc-card-title">Values</h2>
          <div className="tc-fields">
            <div className="tc-field-row">
              <label htmlFor="tc-iso" className="tool-field-label">
                ISO 8601
              </label>
              <input
                id="tc-iso"
                type="text"
                className="tool-field-input tool-field-input--mono"
                value={iso}
                onChange={(e) => handleField('iso', e.target.value)}
                placeholder="2024-01-15T12:34:56.000Z"
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
              />
              <Button
                variant="neutral"
                onClick={() => copy(iso)}
                disabled={!iso}
              >
                Copy
              </Button>
            </div>

            <div className="tc-field-row">
              <label htmlFor="tc-seconds" className="tool-field-label">
                Unix seconds
              </label>
              <input
                id="tc-seconds"
                type="text"
                inputMode="numeric"
                className="tool-field-input tool-field-input--mono"
                value={seconds}
                onChange={(e) => handleField('seconds', e.target.value)}
                placeholder="1700000000"
                spellCheck={false}
                autoComplete="off"
              />
              <Button
                variant="neutral"
                onClick={() => copy(seconds)}
                disabled={!seconds}
              >
                Copy
              </Button>
            </div>

            <div className="tc-field-row">
              <label htmlFor="tc-millis" className="tool-field-label">
                Unix ms
              </label>
              <input
                id="tc-millis"
                type="text"
                inputMode="numeric"
                className="tool-field-input tool-field-input--mono"
                value={millis}
                onChange={(e) => handleField('millis', e.target.value)}
                placeholder="1700000000000"
                spellCheck={false}
                autoComplete="off"
              />
              <Button
                variant="neutral"
                onClick={() => copy(millis)}
                disabled={!millis}
              >
                Copy
              </Button>
            </div>

            <div className="tc-field-row">
              <label htmlFor="tc-human" className="tool-field-label">
                Human
              </label>
              <input
                id="tc-human"
                type="text"
                className="tool-field-input tool-field-input--mono tc-field-input--readonly"
                value={human}
                readOnly
                placeholder="—"
              />
              <Button
                variant="neutral"
                onClick={() => copy(human)}
                disabled={!human}
              >
                Copy
              </Button>
            </div>
          </div>

          {error && (
            <p className="tc-error" role="alert">
              {error}
            </p>
          )}
          {!error && !hasValue && (
            <p className="tc-empty">
              Enter any field above or click <strong>Now</strong> to start.
            </p>
          )}
        </Card>
      </div>
    </ToolPage>
  );
}

export default function TimestampConverter() {
  return (
    <StorageProvider>
      <TimestampConverterContent />
    </StorageProvider>
  );
}
