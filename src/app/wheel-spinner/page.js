'use client';
import {useEffect, useMemo, useRef, useState} from 'react';
import ToolPage from '../../components/ToolPage';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ToastContainer from '../../components/ToastContainer';
import {useToast} from '../../hooks/useToast';
import {useAutoSave} from '../../hooks/useAutoSave';
import {useHydrateStorage} from '../../hooks/useHydrateStorage';
import {StorageProvider, useStorageData} from './StorageContext';
import ListEditor from './components/ListEditor';
import ModeToggle from '../../components/ModeToggle';
import QuickPick from './components/QuickPick';
import SpinWheel from './components/SpinWheel';
import PicksList from './components/PicksList';
import {usePicker} from './hooks';
import {parseEntries} from './utils';
import {
  DEFAULT_STATE,
  MAX_ENTRIES_SOFT_CAP,
  MIN_ENTRIES,
  PRESENTATIONS,
  PRESENTATION_OPTIONS,
  SESSION_MODES,
  SESSION_OPTIONS,
  STATE_AUTOSAVE_DEBOUNCE_MS,
} from './constants';
import './wheel-spinner.css';

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Wheel Spinner',
  description:
    'Free random picker. Drop a list, choose Quick Pick or Spin Wheel, and the choice is made fairly with cryptographic randomness — entirely in your browser.',
  url: 'https://auxbox.tools/wheel-spinner',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Any',
  offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'},
};

function arraysEqual(a, b) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function WheelSpinnerContent() {
  const {toasts, showToast, dismissToast} = useToast();
  const {loadState, saveState, clearState, storageErrors} = useStorageData();

  const [text, setText] = useState('');
  const [presentation, setPresentation] = useState(DEFAULT_STATE.presentation);
  const [sessionMode, setSessionMode] = useState(DEFAULT_STATE.sessionMode);
  // Picks are session-only — never persisted.
  const [picks, setPicks] = useState([]);
  const [announcement, setAnnouncement] = useState('');
  // The last explicitly saved options snapshot. Persisted options only update
  // when the user clicks Save — not on every keystroke.
  const [savedOptions, setSavedOptions] = useState([]);

  // The roster the picks list was derived from. If the parsed options
  // change (user edits the textarea), we clear picks so the session
  // restarts with the new roster.
  const picksSourceRef = useRef([]);

  const {
    winnerIndex,
    winnerLabel,
    highlightIndex,
    rotation,
    isRunning,
    isSpinning,
    pick,
    reset,
    handleSpinTransitionEnd,
  } = usePicker();

  const inFlightRef = useRef(null);
  // Pinned to the spin-time roster until the next pick so the wheel doesn't
  // visually snap to the shrunken working list when the winner is announced.
  const pinnedEntriesRef = useRef(null);

  const options = useMemo(() => parseEntries(text), [text]);

  // Working list:
  //  - single mode: every parsed option is in play.
  //  - multiple mode: parsed options minus the already-picked ones.
  const workingList = useMemo(() => {
    if (sessionMode === SESSION_MODES.SINGLE) return options;
    if (picks.length === 0) return options;
    const taken = new Set(picks);
    return options.filter((o) => !taken.has(o));
  }, [options, picks, sessionMode]);

  const canPick = workingList.length >= 1 && !isRunning && options.length >= MIN_ENTRIES;
  // In single mode we also require >=2 in working list (== options) so a
  // 1-entry pick isn't trivially pre-determined; spec says min 2 entries.
  const canPickEffective =
    sessionMode === SESSION_MODES.MULTIPLE
      ? canPick
      : !isRunning && options.length >= MIN_ENTRIES;

  // Hydrate from storage once on mount.
  const hydrated = useHydrateStorage(() => {
    const saved = loadState();
    if (saved) {
      if (Array.isArray(saved.options) && saved.options.length > 0) {
        setText(saved.options.join('\n'));
        setSavedOptions(saved.options.slice());
        picksSourceRef.current = saved.options.slice();
      }
      if (saved.presentation) setPresentation(saved.presentation);
      if (saved.sessionMode) setSessionMode(saved.sessionMode);
    }
  });

  useEffect(() => {
    if (storageErrors?.state) {
      showToast(`${storageErrors.state}. Using defaults.`, 'error');
    }
  }, [storageErrors?.state, showToast]);

  // Auto-save debounced (~300ms) for UX preferences only. `options` are
  // persisted explicitly via the Save button, not on every keystroke. Picks
  // are NEVER included.
  const {markDirty} = useAutoSave({
    enabled: hydrated,
    deps: [savedOptions, presentation, sessionMode],
    onSave: () => saveState({options: savedOptions, presentation, sessionMode}),
    debounceMs: STATE_AUTOSAVE_DEBOUNCE_MS,
  });

  // Editing the textarea: if the parsed roster differs from the picks-source
  // roster, clear the picks (the session is invalid for the new list).
  useEffect(() => {
    if (!hydrated) return;
    if (!arraysEqual(options, picksSourceRef.current)) {
      if (picks.length > 0) setPicks([]);
      picksSourceRef.current = options.slice();
    }
    // We intentionally don't depend on `picks` to avoid clobbering it on a
    // legitimate pick append — picks change does NOT alter the source ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, options]);

  // When the picker finishes, announce + (in multiple mode) append the pick.
  useEffect(() => {
    if (winnerIndex == null || winnerLabel == null) return;
    setAnnouncement(`Winner: ${winnerLabel}`);
    if (sessionMode === SESSION_MODES.MULTIPLE) {
      setPicks((prev) => [...prev, winnerLabel]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winnerIndex, winnerLabel]);

  const handlePick = () => {
    if (!canPickEffective) return;
    setAnnouncement('');
    // Picker operates on the *currently displayed* working list.
    const snapshot = workingList.slice();
    const winner = pick(presentation, snapshot);
    if (winner == null) return;
    inFlightRef.current = {entries: snapshot, winner};
    // Pin the wheel to this roster until the next pick so the SVG does not
    // snap to the shrunken working list the instant the winner banner appears.
    pinnedEntriesRef.current = snapshot;
  };

  const handleSetPresentation = (next) => {
    if (isRunning) return;
    markDirty();
    setPresentation(next);
    // Picks survive a presentation switch by spec.
    reset();
    setAnnouncement('');
  };

  const handleSetSessionMode = (next) => {
    if (isRunning) return;
    markDirty();
    setSessionMode(next);
    reset();
    setAnnouncement('');
  };

  const handleResetPicks = () => {
    if (isRunning) return;
    setPicks([]);
    reset();
    setAnnouncement('');
    pinnedEntriesRef.current = null;
  };

  const handleSave = () => {
    markDirty();
    setSavedOptions(options.slice());
    saveState({options, presentation, sessionMode});
    showToast('Entries saved', 'success');
  };

  const handleClear = () => {
    if (isRunning) return;
    markDirty();
    setText('');
    setSavedOptions([]);
    setPicks([]);
    // Synchronously wipe storage so a refresh immediately after Clear does
    // not restore the old list (cannot rely on the 300ms autosave debounce).
    clearState();
    reset();
    setAnnouncement('');
    pinnedEntriesRef.current = null;
  };

  // Action button label adapts in Pick-multiple mode.
  const actionLabel = (() => {
    if (isRunning) return 'Picking…';
    if (sessionMode !== SESSION_MODES.MULTIPLE) return 'Pick';
    if (workingList.length === 0) return 'All picked';
    if (workingList.length === 1) return 'Pick last';
    return 'Pick next';
  })();

  const canSave =
    options.length >= MIN_ENTRIES && options.length <= MAX_ENTRIES_SOFT_CAP;
  const canClear = text.length > 0 || savedOptions.length > 0;

  const showResetPicks =
    sessionMode === SESSION_MODES.MULTIPLE && picks.length > 0;

  const allPicked =
    sessionMode === SESSION_MODES.MULTIPLE &&
    options.length >= MIN_ENTRIES &&
    workingList.length === 0;

  return (
    <ToolPage
      title="Wheel Spinner"
      tagline="Drop a list, hit pick. Quick Pick or Spin Wheel — fair, free, browser-only."
      schema={SCHEMA}
      schemaId="wheel-spinner-schema"
      narrow
      errorMessage="There was an error loading the wheel spinner. Please refresh the page."
    >
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="tool-sr-only"
      >
        {announcement}
      </p>

      <div className="tool-stack">
        <Card>
          <ListEditor
            text={text}
            onChange={setText}
            parsedCount={options.length}
          />
          <div className="ws-save-row">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!canSave}
            >
              Save
            </Button>
            <Button
              variant="neutral"
              onClick={handleClear}
              disabled={!canClear || isRunning}
            >
              Clear
            </Button>
          </div>
        </Card>

        <Card>
          <div className="ws-controls">
            <div className="ws-control-group">
              <span className="ws-control-label">Mode</span>
              <ModeToggle
                ariaLabel="Picker mode"
                options={PRESENTATION_OPTIONS}
                value={presentation}
                onChange={handleSetPresentation}
                disabled={isRunning}
              />
            </div>

            <div className="ws-control-group">
              <span className="ws-control-label">Session</span>
              <ModeToggle
                ariaLabel="Session mode"
                options={SESSION_OPTIONS}
                value={sessionMode}
                onChange={handleSetSessionMode}
                disabled={isRunning}
              />
            </div>
          </div>

          <div className="ws-action-row">
            <Button
              variant="primary"
              onClick={handlePick}
              disabled={!canPickEffective || allPicked}
              block
            >
              {actionLabel}
            </Button>
            {allPicked && (
              <p className="ws-action-hint">
                The list is empty. Reset the picks to start over.
              </p>
            )}
          </div>
        </Card>

        <Card>
          {presentation === PRESENTATIONS.WHEEL ? (
            <SpinWheel
              entries={pinnedEntriesRef.current ?? workingList}
              rotation={rotation}
              isSpinning={isSpinning}
              onTransitionEnd={() => {
                const f = inFlightRef.current;
                if (!f) return;
                handleSpinTransitionEnd(f.entries, f.winner);
              }}
            />
          ) : (
            <QuickPick
              entries={workingList}
              highlightIndex={highlightIndex}
              isRunning={isRunning}
              isDone={winnerIndex != null}
            />
          )}

          <div
            className={`ws-result${winnerLabel ? ' ws-result--shown' : ''}`}
            aria-hidden={winnerLabel ? 'false' : 'true'}
          >
            {winnerLabel ? (
              <>
                <span className="ws-result-label">Winner</span>
                <strong className="ws-result-value">{winnerLabel}</strong>
              </>
            ) : (
              <span className="ws-result-placeholder">
                {options.length < MIN_ENTRIES
                  ? 'Add entries above to begin.'
                  : 'Press the action button to choose.'}
              </span>
            )}
          </div>

          {sessionMode === SESSION_MODES.MULTIPLE && (
            <PicksList picks={picks} />
          )}
        </Card>

        {showResetPicks && (
          <div className="ws-actions">
            <Button
              variant="info"
              onClick={handleResetPicks}
              disabled={isRunning}
            >
              Reset picks
            </Button>
          </div>
        )}
      </div>
    </ToolPage>
  );
}

export default function WheelSpinner() {
  return (
    <StorageProvider>
      <WheelSpinnerContent />
    </StorageProvider>
  );
}
