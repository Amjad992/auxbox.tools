'use client';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {DateTime} from 'luxon';
import ToolPage from '../../components/ToolPage';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ToastContainer from '../../components/ToastContainer';
import {useToast} from '../../hooks/useToast';
import {useTicker} from '../../hooks/useTicker';
import {useDocumentTitle} from '../../hooks/useDocumentTitle';
import {StorageProvider, useStorageData} from './StorageContext';
import {useStopwatch} from './hooks';
import {STATE_AUTOSAVE_DEBOUNCE_MS, STATUS, STORAGE_KEY} from './constants';
import {computeElapsed, formatHMSms, formatTitleTime} from './utils';
import './stopwatch.css';

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Stopwatch',
  description:
    'Free online stopwatch with laps and keyboard shortcuts. Survives reload, runs entirely in your browser.',
  url: 'https://auxbox.tools/stopwatch',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Any',
  offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'},
};

function StopwatchContent() {
  const {toasts, showToast, dismissToast} = useToast();
  const {loadState, saveState, clearState, storageErrors} = useStorageData();

  const sw = useStopwatch();
  const {status, startedAt, accumulatedMs, laps, start, stop, lap, reset, restore} = sw;

  const [hydrated, setHydrated] = useState(false);
  // forceTick exists purely to trigger a re-render every frame while running.
  // The displayed elapsed value is computed from state + DateTime.now().toMillis()
  // at render time; we don't store `now` here.
  const [, setTick] = useState(0);
  const dirtyRef = useRef(false);

  // Hydrate once on mount.
  useEffect(() => {
    const saved = loadState();
    if (saved && typeof saved === 'object') {
      restore(saved);
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
      saveState({status, startedAt, accumulatedMs, laps});
    }, STATE_AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [hydrated, status, startedAt, accumulatedMs, laps, saveState]);

  // rAF tick while running — re-render so the display reflects the new now().
  useTicker(
    useCallback(() => {
      setTick((n) => (n + 1) % 1_000_000);
    }, []),
    {active: status === STATUS.RUNNING}
  );

  // Live elapsed for the headline display. Wall-clock via Luxon for codebase
  // consistency (Date Calculator uses Luxon throughout).
  const liveElapsedMs = computeElapsed(
    {status, startedAt, accumulatedMs},
    DateTime.now().toMillis()
  );

  // Title is updated at most once per second to avoid wasteful churn.
  const titleSeconds = Math.floor(liveElapsedMs / 1000);
  const titleStr = useMemo(() => {
    if (status !== STATUS.RUNNING) return null;
    return `${formatTitleTime(titleSeconds * 1000)} · Stopwatch`;
    // titleSeconds drives the once-per-second update; status flip clears it.
  }, [status, titleSeconds]);
  useDocumentTitle(titleStr);

  // ─── User actions (mark dirty so the next save runs) ─────────────────
  const handleStart = useCallback(() => {
    dirtyRef.current = true;
    start();
  }, [start]);

  const handleStop = useCallback(() => {
    dirtyRef.current = true;
    stop();
  }, [stop]);

  const handleLap = useCallback(() => {
    dirtyRef.current = true;
    lap();
  }, [lap]);

  const handleReset = useCallback(() => {
    // Synchronous wipe + dirty=false so the post-Reset auto-save effect tick
    // skips and no phantom record is written 300 ms later (markdown-preview
    // MAJ-2 fix shape).
    dirtyRef.current = false;
    clearState();
    reset();
    showToast('Stopwatch reset', 'success');
  }, [clearState, reset, showToast]);

  const handleToggle = useCallback(() => {
    if (status === STATUS.RUNNING) {
      handleStop();
    } else {
      handleStart();
    }
  }, [status, handleStart, handleStop]);

  // ─── Keyboard shortcuts ──────────────────────────────────────────────
  useEffect(() => {
    function isFormFieldTarget(el) {
      if (!el || typeof el.matches !== 'function') return false;
      return el.matches('input, textarea, [contenteditable]:not([contenteditable="false"])');
    }

    function onKeyDown(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isFormFieldTarget(e.target)) return;

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        handleToggle();
        return;
      }
      const key = e.key?.toLowerCase();
      if (key === 'l') {
        if (status === STATUS.RUNNING) {
          e.preventDefault();
          handleLap();
        }
        return;
      }
      if (key === 'r') {
        e.preventDefault();
        handleReset();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [status, handleToggle, handleLap, handleReset]);

  const reversedLaps = useMemo(() => laps.slice().reverse(), [laps]);

  const isRunning = status === STATUS.RUNNING;
  const canReset = status !== STATUS.IDLE || accumulatedMs > 0 || laps.length > 0;

  return (
    <ToolPage
      title="Stopwatch"
      tagline="Big-display stopwatch with laps and keyboard shortcuts. Survives reload, runs entirely in your browser."
      schema={SCHEMA}
      schemaId="stopwatch-schema"
      narrow
      errorMessage="There was an error loading the stopwatch. Please refresh the page."
    >
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="sw-stack">
        <Card>
          <div
            className="sw-display"
            data-status={status}
            role="timer"
            aria-label="Elapsed time"
          >
            {formatHMSms(liveElapsedMs)}
          </div>

          <div className="sw-actions">
            {isRunning ? (
              <Button variant="danger" onClick={handleStop} aria-label="Stop">
                Stop
              </Button>
            ) : (
              <Button variant="primary" onClick={handleStart} aria-label="Start">
                Start
              </Button>
            )}
            <Button
              variant="info"
              onClick={handleLap}
              disabled={!isRunning}
              aria-label="Lap"
            >
              Lap
            </Button>
            <Button
              variant="neutral"
              onClick={handleReset}
              disabled={!canReset}
              aria-label="Reset"
            >
              Reset
            </Button>
          </div>

          <p className="sw-shortcuts">
            Shortcuts:
            <kbd className="sw-shortcut-key">Space</kbd> start/stop ·
            <kbd className="sw-shortcut-key">L</kbd> lap ·
            <kbd className="sw-shortcut-key">R</kbd> reset
          </p>
        </Card>

        <Card>
          <h2
            style={{margin: '0 0 0.75rem', fontSize: '1rem', color: 'var(--text-secondary)'}}
          >
            Laps
          </h2>
          {laps.length === 0 ? (
            <p className="sw-laps-empty">No laps yet — press Lap (or L) while running.</p>
          ) : (
            <div className="sw-laps-scroll">
              <table className="sw-laps-table">
                <thead>
                  <tr>
                    <th scope="col">Lap</th>
                    <th scope="col">Delta</th>
                    <th scope="col">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {reversedLaps.map((row) => (
                    <tr key={row.index}>
                      <td>#{row.index}</td>
                      <td>+{formatHMSms(row.deltaMs)}</td>
                      <td>{formatHMSms(row.totalElapsedMs)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </ToolPage>
  );
}

export default function Stopwatch() {
  return (
    <StorageProvider>
      <StopwatchContent />
    </StorageProvider>
  );
}

// Exported for tests.
export {STORAGE_KEY};
