'use client';
import {useEffect, useRef, useState} from 'react';
import ToolPage from '../../components/ToolPage';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ModeToggle from '../../components/ModeToggle';
import DropZone from '../../components/DropZone';
import ToastContainer from '../../components/ToastContainer';
import {useToast} from '../../hooks/useToast';
import {useAutoSave} from '../../hooks/useAutoSave';
import {useHydrateStorage} from '../../hooks/useHydrateStorage';
import {useCopyToClipboard} from '../../hooks/useCopyToClipboard';
import {StorageProvider, useStorageData} from './StorageContext';
import {
  ALGOS,
  DEFAULT_STATE,
  LARGE_FILE_WARN_BYTES,
  MODES,
  MODE_OPTIONS,
  STATE_AUTOSAVE_DEBOUNCE_MS,
  TEXT_DEBOUNCE_MS,
} from './constants';
import {formatBytes, hashBuffer, hashText} from './utils';
import './hash-generator.css';

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Hash Generator',
  description:
    'Free hash generator. Paste text or drop a file → SHA-256, SHA-512, SHA-1, MD5 hashes side-by-side. Browser-only.',
  url: 'https://auxbox.tools/hash-generator',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Any',
  offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'},
};

function HashGeneratorContent() {
  const {toasts, showToast, dismissToast} = useToast();
  const {loadState, saveState, clearState, storageErrors} = useStorageData();

  // Mode is persisted; the actual hashed input is not.
  const [mode, setMode] = useState(DEFAULT_STATE.mode);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [hashes, setHashes] = useState(null);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState(null);

  const hydrated = useHydrateStorage(() => {
    const saved = loadState();
    if (saved && typeof saved === 'object' && typeof saved.mode === 'string') {
      setMode(saved.mode);
    }
  });

  useEffect(() => {
    if (storageErrors?.state) {
      showToast(`${storageErrors.state}. Using defaults.`, 'error');
    }
  }, [storageErrors?.state, showToast]);

  const {markDirty, markClean} = useAutoSave({
    onSave: () => saveState({mode}),
    enabled: hydrated,
    deps: [mode],
    debounceMs: STATE_AUTOSAVE_DEBOUNCE_MS,
  });

  // Live recompute on text change with debounce. Only fires in text mode.
  // The `attempt` counter — bumped in cleanup — is the explicit contract
  // that any in-flight hash from this run is discarded the moment the
  // input changes (or the user clears, switches mode, unmounts). Forgetting
  // to bump previously meant a stale "abc" hash could re-appear after the
  // user wiped the textarea.
  const attemptRef = useRef(0);
  useEffect(() => {
    if (mode !== MODES.TEXT) return undefined;
    if (text === '') {
      setHashes(null);
      setComputing(false);
      setError(null);
      return undefined;
    }
    const myAttempt = ++attemptRef.current;
    setComputing(true);
    setError(null);
    // Clear stale hashes immediately so the Copy buttons can't copy the
    // *previous* input's digest during the 200 ms debounce window.
    setHashes(null);
    const handle = setTimeout(async () => {
      try {
        const result = await hashText(text, ALGOS);
        if (attemptRef.current === myAttempt) {
          setHashes(result);
          setComputing(false);
        }
      } catch (e) {
        if (attemptRef.current === myAttempt) {
          setError(e?.message || 'Could not compute hashes.');
          setComputing(false);
        }
      }
    }, TEXT_DEBOUNCE_MS);
    return () => {
      // Invalidate this run unconditionally so an already-fired but still
      // pending hash promise can't overwrite the next state. Mutating
      // `attemptRef.current` at cleanup is intentional — the lint rule
      // targets refs that hold DOM nodes, which this isn't.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      attemptRef.current++;
      clearTimeout(handle);
    };
  }, [text, mode]);

  // File picked → compute once.
  useEffect(() => {
    if (mode !== MODES.FILE) return undefined;
    if (!file) {
      setHashes(null);
      setComputing(false);
      setError(null);
      return undefined;
    }
    let cancelled = false;
    setComputing(true);
    setError(null);
    setHashes(null);
    (async () => {
      try {
        const buffer = await file.arrayBuffer();
        const result = await hashBuffer(buffer, ALGOS);
        if (!cancelled) {
          setHashes(result);
          setComputing(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'Could not read or hash this file.');
          setComputing(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file, mode]);

  const handleModeChange = (next) => {
    markDirty();
    setMode(next);
    // Switching mode resets the input + result; the OTHER mode's last
    // input would be misleading once a different surface is on screen.
    setHashes(null);
    setError(null);
    setComputing(false);
    if (next === MODES.TEXT) setFile(null);
    if (next === MODES.FILE) setText('');
  };

  const handleFiles = (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setFile(fileList[0]);
  };

  const handleClear = () => {
    setText('');
    setFile(null);
    setHashes(null);
    setError(null);
    setComputing(false);
    clearState();
    setMode(DEFAULT_STATE.mode);
    markClean();
    showToast('Cleared', 'success');
  };

  const summaryText = hashes
    ? ALGOS.map((algo) => `${algo}: ${hashes[algo]}`).join('\n')
    : '';

  const copy = useCopyToClipboard({
    showToast,
    successMessage: 'Hashes copied',
  });

  const hasInput =
    (mode === MODES.TEXT && text !== '') ||
    (mode === MODES.FILE && file !== null);

  const showLargeWarn =
    mode === MODES.FILE && file && file.size > LARGE_FILE_WARN_BYTES;

  return (
    <ToolPage
      title="Hash Generator"
      tagline="SHA-256, SHA-1, SHA-512, MD5 for any text or file. Computed in your browser — your input never leaves the device."
      schema={SCHEMA}
      schemaId="hash-generator-schema"
      errorMessage="There was an error loading the hash generator. Please refresh the page."
    >
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="tool-stack">
        <Card>
          <h2 className="hg-card-title">Mode</h2>
          <ModeToggle
            ariaLabel="Hash mode"
            options={MODE_OPTIONS}
            value={mode}
            onChange={handleModeChange}
          />
        </Card>

        <Card>
          <h2 className="hg-card-title">
            {mode === MODES.TEXT ? 'Text' : 'File'}
          </h2>
          {mode === MODES.TEXT ? (
            <>
              <p className="hg-card-hint">
                Type or paste any text. Hashes recompute as you type.
              </p>
              <textarea
                aria-label="Text to hash"
                className="tool-textarea hg-textarea"
                rows={6}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste any text…"
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
              />
            </>
          ) : (
            <>
              <p className="hg-card-hint">
                Drop a file or pick one. Files are read in memory and hashed
                locally — never uploaded.
              </p>
              <DropZone
                onFiles={handleFiles}
                multiple={false}
                label="Drop a file or click to pick one"
                hint="Any file type. Large files take a moment to digest."
              />
              {file && (
                <>
                  <div className="hg-file-info">
                    <p className="hg-file-name">{file.name}</p>
                    <span className="hg-file-size">
                      {formatBytes(file.size)}
                    </span>
                  </div>
                  {showLargeWarn && (
                    <p className="hg-file-warning" role="status">
                      This file is over {formatBytes(LARGE_FILE_WARN_BYTES)} —
                      MD5 hashing runs synchronously and may freeze the page
                      for several seconds.
                    </p>
                  )}
                  <div className="hg-file-actions">
                    <Button
                      variant="neutral"
                      onClick={() => setFile(null)}
                    >
                      Clear file
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </Card>

        <Card>
          <h2 className="hg-card-title">Hashes</h2>
          <div className="hg-hashes" aria-live="polite" aria-atomic="true">
            {error ? (
              <p className="hg-hash-empty" role="alert">
                {error}
              </p>
            ) : hasInput ? (
              ALGOS.map((algo) => {
                const hex = hashes?.[algo];
                return (
                  <div key={algo} className="hg-hash-row">
                    <span className="hg-hash-algo">{algo}</span>
                    {hex ? (
                      <code className="hg-hash-value">{hex}</code>
                    ) : (
                      <span className="hg-hash-value hg-hash-value--muted">
                        {computing ? 'Computing…' : '—'}
                      </span>
                    )}
                    <Button
                      variant="neutral"
                      onClick={() => copy(hex)}
                      disabled={!hex}
                    >
                      Copy
                    </Button>
                  </div>
                );
              })
            ) : (
              <p className="hg-hash-empty">
                {mode === MODES.TEXT
                  ? 'Enter text above to compute hashes.'
                  : 'Drop or pick a file above to compute hashes.'}
              </p>
            )}
          </div>
        </Card>

        <div className="hg-actions">
          <Button
            variant="primary"
            onClick={() => copy(summaryText)}
            disabled={!hashes}
          >
            Copy all
          </Button>
          <Button variant="neutral" onClick={handleClear} disabled={!hasInput}>
            Clear
          </Button>
        </div>

        <p className="hg-privacy-note">
          Privacy: input text and files are <strong>never persisted</strong>{' '}
          and never leave your browser.
        </p>
      </div>
    </ToolPage>
  );
}

export default function HashGenerator() {
  return (
    <StorageProvider>
      <HashGeneratorContent />
    </StorageProvider>
  );
}
