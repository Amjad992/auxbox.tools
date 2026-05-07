'use client';
import {useEffect, useMemo, useState} from 'react';
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
  FLAG_OPTIONS,
  PRESETS,
  STATE_AUTOSAVE_DEBOUNCE_MS,
} from './constants';
import {buildHighlightSegments, compileRegex, findMatches} from './utils';
import './regex-tester.css';

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Regex Tester',
  description:
    'Live regex tester with match highlighting, capture-group display, and common-pattern presets. Browser-only.',
  url: 'https://auxbox.tools/regex-tester',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Any',
  offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'},
};

function RegexTesterContent() {
  const {toasts, showToast, dismissToast} = useToast();
  const {loadState, saveState, clearState, storageErrors} = useStorageData();

  const [pattern, setPattern] = useState(DEFAULT_STATE.pattern);
  const [flags, setFlags] = useState(DEFAULT_STATE.flags);
  const [test, setTest] = useState(DEFAULT_STATE.test);

  const hydrated = useHydrateStorage(() => {
    const saved = loadState();
    if (saved && typeof saved === 'object') {
      if (typeof saved.pattern === 'string') setPattern(saved.pattern);
      if (typeof saved.flags === 'string') setFlags(saved.flags);
      if (typeof saved.test === 'string') setTest(saved.test);
    }
  });

  useEffect(() => {
    if (storageErrors?.state) {
      showToast(`${storageErrors.state}. Using defaults.`, 'error');
    }
  }, [storageErrors?.state, showToast]);

  const {markDirty, markClean} = useAutoSave({
    onSave: () => saveState({pattern, flags, test}),
    enabled: hydrated,
    deps: [pattern, flags, test],
    debounceMs: STATE_AUTOSAVE_DEBOUNCE_MS,
  });

  const compiled = useMemo(() => compileRegex(pattern, flags), [pattern, flags]);
  const matches = useMemo(() => {
    if (!compiled.ok) return [];
    return findMatches(compiled.regex, test);
  }, [compiled, test]);
  const segments = useMemo(
    () => buildHighlightSegments(test, matches),
    [test, matches]
  );

  const toggleFlag = (flag) => {
    markDirty();
    setFlags((current) => {
      if (current.includes(flag)) {
        return current
          .split('')
          .filter((c) => c !== flag)
          .join('');
      }
      return current + flag;
    });
  };

  const applyPreset = (preset) => {
    markDirty();
    setPattern(preset.pattern);
    setFlags(preset.flags);
  };

  const handleClear = () => {
    setPattern('');
    setFlags(DEFAULT_STATE.flags);
    setTest('');
    clearState();
    markClean();
    showToast('Cleared', 'success');
  };

  const hasInput = pattern !== '' && test !== '';
  const isError = pattern !== '' && !compiled.ok;

  return (
    <ToolPage
      title="Regex Tester"
      tagline="Type a pattern + flags, drop in test text, see live match highlighting and capture groups. Pattern presets and full JS regex flag support."
      schema={SCHEMA}
      schemaId="regex-tester-schema"
      errorMessage="There was an error loading the regex tester. Please refresh the page."
    >
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="tool-stack">
        <Card>
          <h2 className="rt-card-title">Pattern</h2>
          <div
            className={`rt-pattern-slot${
              isError ? ' rt-pattern-slot--error' : ''
            }`}
          >
            <span className="rt-slash" aria-hidden="true">
              /
            </span>
            <input
              type="text"
              className="rt-pattern-input-bare"
              value={pattern}
              onChange={(e) => {
                markDirty();
                setPattern(e.target.value);
              }}
              placeholder="\\b\\w+@\\w+\\.\\w+\\b"
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              aria-label="Regex pattern"
            />
            <span className="rt-slash" aria-hidden="true">
              /
            </span>
            <span className="rt-flags-display" aria-label="Active flags">
              {flags || 'no flags'}
            </span>
          </div>

          <fieldset className="rt-flag-group">
            <legend className="tool-sr-only">Flags</legend>
            {FLAG_OPTIONS.map((opt) => {
              const active = flags.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className={`rt-flag${active ? ' rt-flag--active' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleFlag(opt.value)}
                  />
                  {opt.label}
                </label>
              );
            })}
          </fieldset>

          <p className="rt-card-hint" style={{marginTop: '0.75rem'}}>
            Presets:
          </p>
          <div className="rt-presets">
            {PRESETS.map((p) => (
              <button
                type="button"
                key={p.label}
                className="rt-preset"
                onClick={() => applyPreset(p)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {isError && (
            <p className="rt-error" role="alert">
              {compiled.error}
            </p>
          )}
        </Card>

        <Card>
          <h2 className="rt-card-title">Test text</h2>
          <textarea
            aria-label="Test text"
            className="tool-textarea rt-test-area"
            value={test}
            onChange={(e) => {
              markDirty();
              setTest(e.target.value);
            }}
            placeholder="Paste any text to test against the pattern…"
            spellCheck={false}
            autoComplete="off"
          />
          {hasInput && compiled.ok && (
            <>
              <div className="rt-stats">
                <span className="rt-stat-chip">
                  {matches.length} {matches.length === 1 ? 'match' : 'matches'}
                </span>
                <span className="rt-stat-chip">{flags || 'no flags'}</span>
              </div>
              <div
                className="rt-highlight"
                aria-live="polite"
                aria-label="Highlighted matches"
              >
                {segments.length === 0 ? (
                  <span className="rt-empty">No matches.</span>
                ) : (
                  segments.map((seg, i) =>
                    seg.isMatch ? (
                      <mark key={i}>{seg.text}</mark>
                    ) : (
                      <span key={i}>{seg.text}</span>
                    )
                  )
                )}
              </div>
            </>
          )}
        </Card>

        {matches.length > 0 && (
          <Card>
            <h2 className="rt-card-title">Matches ({matches.length})</h2>
            <table className="rt-matches-table">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Match</th>
                  <th scope="col">Index</th>
                  <th scope="col">Groups</th>
                </tr>
              </thead>
              <tbody>
                {matches.slice(0, 100).map((m, i) => (
                  <tr key={`${m.index}-${i}`}>
                    <td>{i + 1}</td>
                    <td>{m.match || '∅'}</td>
                    <td>{m.index}</td>
                    <td>
                      {m.groups.length === 0
                        ? '—'
                        : m.groups
                            .map((g, gi) => `$${gi + 1}=${g ?? ''}`)
                            .join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {matches.length > 100 && (
              <p className="rt-empty">
                Showing first 100 of {matches.length} matches.
              </p>
            )}
          </Card>
        )}

        <div className="rt-actions">
          <Button variant="neutral" onClick={handleClear}>
            Clear
          </Button>
        </div>
      </div>
    </ToolPage>
  );
}

export default function RegexTester() {
  return (
    <StorageProvider>
      <RegexTesterContent />
    </StorageProvider>
  );
}
