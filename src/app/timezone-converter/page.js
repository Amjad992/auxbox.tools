'use client';
import {useEffect, useMemo, useState} from 'react';
import {DateTime} from 'luxon';
import ToolPage from '../../components/ToolPage';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ToastContainer from '../../components/ToastContainer';
import {useToast} from '../../hooks/useToast';
import {useAutoSave} from '../../hooks/useAutoSave';
import {useHydrateStorage} from '../../hooks/useHydrateStorage';
import {StorageProvider, useStorageData} from './StorageContext';
import {
  DEFAULT_STATE,
  MAX_TARGETS,
  STATE_AUTOSAVE_DEBOUNCE_MS,
  ZONE_OPTIONS,
} from './constants';
import {
  buildZoneRow,
  nowInZone,
  parseLocalInput,
  resolveZone,
  toLocalInput,
} from './utils';
import './timezone-converter.css';

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Time Zone Converter',
  description:
    'Convert one moment across multiple time zones at once. Browser-only.',
  url: 'https://auxbox.tools/timezone-converter',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Any',
  offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'},
};

function TimezoneConverterContent() {
  const {toasts, showToast, dismissToast} = useToast();
  const {loadState, saveState, clearState, storageErrors} = useStorageData();

  const [anchorZone, setAnchorZone] = useState(DEFAULT_STATE.anchorZone);
  const [targets, setTargets] = useState(DEFAULT_STATE.targets);
  const [anchorInput, setAnchorInput] = useState(() =>
    toLocalInput(nowInZone(DEFAULT_STATE.anchorZone))
  );
  const [pickerZone, setPickerZone] = useState('');

  const hydrated = useHydrateStorage(() => {
    const saved = loadState();
    if (saved && typeof saved === 'object') {
      if (typeof saved.anchorZone === 'string') setAnchorZone(saved.anchorZone);
      if (Array.isArray(saved.targets)) setTargets(saved.targets);
    }
  });

  useEffect(() => {
    if (storageErrors?.state) {
      showToast(`${storageErrors.state}. Using defaults.`, 'error');
    }
  }, [storageErrors?.state, showToast]);

  const {markDirty, markClean} = useAutoSave({
    onSave: () => saveState({anchorZone, targets}),
    enabled: hydrated,
    deps: [anchorZone, targets],
    debounceMs: STATE_AUTOSAVE_DEBOUNCE_MS,
  });

  const anchorResult = useMemo(
    () => parseLocalInput(anchorInput, anchorZone),
    [anchorInput, anchorZone]
  );
  // Convenience: the DateTime (or null) extracted from the richer result object.
  const anchorDt = anchorResult ? anchorResult.dt : null;

  const handleAnchorZoneChange = (next) => {
    markDirty();
    // Re-anchor: keep the same instant, present it in the new zone.
    if (anchorDt) {
      const inNewZone = anchorDt.setZone(resolveZone(next));
      setAnchorInput(toLocalInput(inNewZone));
    }
    // S4: clear stale pickerZone when it matches the new anchor zone.
    if (pickerZone === next) setPickerZone('');
    // S4: remove from targets if the user picks an existing target as the anchor.
    if (targets.includes(next)) {
      markDirty();
      setTargets((prev) => prev.filter((z) => z !== next));
    }
    setAnchorZone(next);
  };

  const handleNow = () => {
    setAnchorInput(toLocalInput(nowInZone(anchorZone)));
    showToast('Set to now', 'success');
  };

  const handleAddTarget = () => {
    if (!pickerZone) return;
    if (targets.includes(pickerZone)) {
      showToast('Zone already added', 'error');
      return;
    }
    if (targets.length >= MAX_TARGETS) {
      showToast(`Maximum ${MAX_TARGETS} target zones`, 'error');
      return;
    }
    markDirty();
    setTargets([...targets, pickerZone]);
    setPickerZone('');
  };

  const handleRemoveTarget = (zone) => {
    markDirty();
    setTargets(targets.filter((z) => z !== zone));
  };

  const handleMoveTarget = (zone, direction) => {
    const idx = targets.indexOf(zone);
    if (idx < 0) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= targets.length) return;
    markDirty();
    const next = [...targets];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    setTargets(next);
  };

  const handleClear = () => {
    clearState();
    setAnchorZone(DEFAULT_STATE.anchorZone);
    setTargets(DEFAULT_STATE.targets);
    setAnchorInput(toLocalInput(nowInZone(DEFAULT_STATE.anchorZone)));
    markClean();
    showToast('Reset to defaults', 'success');
  };

  // Available picker options exclude already-added zones + the anchor.
  const pickerOptions = useMemo(() => {
    const used = new Set([anchorZone, ...targets]);
    return ZONE_OPTIONS.filter((z) => !used.has(z.value));
  }, [anchorZone, targets]);

  const targetRows = useMemo(
    () => targets.map((z) => buildZoneRow(anchorDt, z)),
    [anchorDt, targets]
  );

  const isValidAnchor = anchorDt !== null;
  const anchorAbbr = anchorDt ? anchorDt.toFormat('ZZZZ') : '';
  const dstNormalized = anchorResult?.normalized ?? false;
  const dstNormalizedTo = anchorResult?.normalizedTo ?? null;

  return (
    <ToolPage
      title="Time Zone Converter"
      tagline="Pick an anchor moment in one zone — see the same instant in any number of others. Add up to 12 target zones; reorder with up/down."
      schema={SCHEMA}
      schemaId="timezone-converter-schema"
      errorMessage="There was an error loading the timezone converter. Please refresh the page."
    >
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="tool-stack">
        <Card>
          <h2 className="tz-card-title">Anchor moment</h2>
          <div className="tz-anchor-row">
            <div className="tool-field">
              <label htmlFor="tz-anchor-time" className="tool-field-label">
                Local date/time
              </label>
              <input
                id="tz-anchor-time"
                type="datetime-local"
                className="tool-field-input"
                value={anchorInput}
                onChange={(e) => setAnchorInput(e.target.value)}
              />
            </div>

            <div className="tool-field">
              <label htmlFor="tz-anchor-zone" className="tool-field-label">
                Zone
              </label>
              <select
                id="tz-anchor-zone"
                className="tool-select"
                value={anchorZone}
                onChange={(e) => handleAnchorZoneChange(e.target.value)}
              >
                {ZONE_OPTIONS.map((z) => (
                  <option key={z.value} value={z.value}>
                    {z.label}
                  </option>
                ))}
              </select>
            </div>

            <Button variant="primary" onClick={handleNow}>
              Now
            </Button>
          </div>

          {!isValidAnchor && (
            <p className="tz-empty" role="alert">
              Enter a valid date/time.
            </p>
          )}
          {isValidAnchor && dstNormalized && (
            <p className="tz-card-hint" style={{marginTop: '0.5rem'}} role="status" aria-live="polite">
              Spring-forward DST gap — interpreted as{' '}
              <code>{dstNormalizedTo}</code>.
            </p>
          )}
          {isValidAnchor && anchorAbbr && (
            <p className="tz-card-hint" style={{marginTop: '0.5rem'}}>
              Offset: <code>{anchorAbbr}</code>
            </p>
          )}
        </Card>

        <Card>
          <h2 className="tz-card-title">Target zones</h2>
          {targets.length === 0 ? (
            <p className="tz-empty" role="status" aria-live="polite">No target zones yet.</p>
          ) : (
            <div className="tz-target-list">
              {targetRows.map((row, idx) => {
                const z = ZONE_OPTIONS.find((o) => o.value === row.zone);
                const label = z?.label || row.zone;
                return (
                  <div key={row.zone} className="tz-target-row">
                    <div className="tz-target-info">
                      <span className="tz-target-name">{label}</span>
                      <span className="tz-target-time">
                        {row.formatted || '—'}
                      </span>
                      <span className="tz-target-meta">
                        <span>{row.weekday}</span>
                        <span>{row.abbreviation}</span>
                        <span>{row.offsetLabel}</span>
                      </span>
                    </div>
                    <div className="tz-target-actions">
                      <Button
                        variant="neutral"
                        onClick={() => handleMoveTarget(row.zone, 'up')}
                        disabled={idx === 0}
                        aria-label={`Move ${label} up`}
                      >
                        ↑
                      </Button>
                      <Button
                        variant="neutral"
                        onClick={() => handleMoveTarget(row.zone, 'down')}
                        disabled={idx === targets.length - 1}
                        aria-label={`Move ${label} down`}
                      >
                        ↓
                      </Button>
                      <Button
                        variant="neutral"
                        onClick={() => handleRemoveTarget(row.zone)}
                        aria-label={`Remove ${label}`}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="tz-add-row">
            <select
              aria-label="Add target zone"
              className="tool-select"
              value={pickerZone}
              onChange={(e) => setPickerZone(e.target.value)}
              disabled={targets.length >= MAX_TARGETS || pickerOptions.length === 0}
            >
              <option value="">— pick a zone —</option>
              {pickerOptions.map((z) => (
                <option key={z.value} value={z.value}>
                  {z.label}
                </option>
              ))}
            </select>
            <Button
              variant="primary"
              onClick={handleAddTarget}
              disabled={!pickerZone}
            >
              + Add
            </Button>
          </div>
          {targets.length >= MAX_TARGETS && (
            <p className="tz-hint">Maximum {MAX_TARGETS} zones reached.</p>
          )}
        </Card>

        <div className="tz-actions">
          <Button variant="neutral" onClick={handleClear}>
            Reset
          </Button>
        </div>
      </div>
    </ToolPage>
  );
}

export default function TimezoneConverter() {
  return (
    <StorageProvider>
      <TimezoneConverterContent />
    </StorageProvider>
  );
}
