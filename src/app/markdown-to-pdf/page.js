'use client';
import {useDeferredValue, useEffect, useMemo, useRef, useState} from 'react';
import ToolPage from '../../components/ToolPage';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ModeToggle from '../../components/ModeToggle';
import ToastContainer from '../../components/ToastContainer';
import {useToast} from '../../hooks/useToast';
import {useAutoSave} from '../../hooks/useAutoSave';
import {useHydrateStorage} from '../../hooks/useHydrateStorage';
import {renderMarkdown} from '../../lib/markdown';
import {HAS_FIELD_SIZING} from '../../lib/featureDetect';
import {StorageProvider, useStorageData} from './StorageContext';
import {
  DEFAULT_STATE,
  MAX_PERSISTED_CHARS,
  PRESETS,
  PRESET_DESCRIPTIONS,
  PRESET_OPTIONS,
  PRESET_VALUES,
  SAMPLE_DOCUMENT,
  STATE_AUTOSAVE_DEBOUNCE_MS,
  presetClass,
} from './constants';
import './markdown-to-pdf.css';

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Markdown to PDF',
  description:
    'Free markdown to PDF tool. Type markdown, pick a print preset, and use your browser to save a paginated PDF. Browser-only, no upload.',
  url: 'https://auxbox.tools/markdown-to-pdf',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Any',
  offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'},
};

function MarkdownToPdfContent() {
  const {toasts, showToast, dismissToast} = useToast();
  const {loadState, saveState, clearState, storageErrors} = useStorageData();

  const [source, setSource] = useState('');
  const [preset, setPreset] = useState(PRESETS.DEFAULT);
  const [announcement, setAnnouncement] = useState('');

  // Ref for the editor textarea — used by the autosize fallback effect.
  const editorRef = useRef(null);

  // Autosize fallback for browsers without `field-sizing: content`.
  // Modern Chromium 123+/Safari 17+ handle sizing via CSS; we skip the
  // inline-height path there so JS doesn't fight with field-sizing
  // (which would otherwise leave the textarea slightly short and
  // re-introduce a scrollbar). Older browsers fall through and get the
  // scrollHeight-driven autosize on mount and on every input.
  // HAS_FIELD_SIZING is cached at module load (src/lib/featureDetect.js)
  // so the check runs once, not on every keystroke.
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (HAS_FIELD_SIZING) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [source]);

  // Defer the preview render so typing latency stays on the textarea.
  const deferredSource = useDeferredValue(source);
  const html = useMemo(() => renderMarkdown(deferredSource), [deferredSource]);

  // Hydrate from storage once on mount.
  const hydrated = useHydrateStorage(() => {
    const saved = loadState();
    if (saved && typeof saved === 'object') {
      if (typeof saved.document === 'string') setSource(saved.document);
      if (
        typeof saved.preset === 'string' &&
        PRESET_VALUES.includes(saved.preset)
      ) {
        setPreset(saved.preset);
      }
    }
  });

  useEffect(() => {
    if (storageErrors?.state) {
      showToast(`${storageErrors.state}. Using defaults.`, 'error');
    }
  }, [storageErrors?.state, showToast]);

  // Auto-save debounced. Skipped until the user has taken an action so a
  // fresh-mount no-interaction visit doesn't write defaults.
  const {markDirty, markClean} = useAutoSave({
    enabled: hydrated && source.length <= MAX_PERSISTED_CHARS,
    deps: [source, preset],
    onSave: () => saveState({document: source, preset}),
    debounceMs: STATE_AUTOSAVE_DEBOUNCE_MS,
  });

  const handleChange = (e) => {
    markDirty();
    setSource(e.target.value);
  };

  const handlePresetChange = (next) => {
    markDirty();
    setPreset(next);
  };

  const handleDownload = () => {
    if (typeof window === 'undefined') return;
    if (typeof window.print !== 'function') return;
    window.print();
  };

  const handleClear = () => {
    // Synchronous wipe + markClean so the post-Clear auto-save effect
    // tick skips and no phantom record is written 300 ms later.
    clearState();
    setSource('');
    setPreset(PRESETS.DEFAULT);
    markClean();
    setAnnouncement('Document cleared');
    showToast('Document cleared', 'success');
  };

  const handleInsertSample = () => {
    markDirty();
    setSource(SAMPLE_DOCUMENT);
  };

  const charCount = source.length;
  const overCap = charCount > MAX_PERSISTED_CHARS;
  const canDownload = source.length > 0;
  const canClear = source.length > 0 || preset !== DEFAULT_STATE.preset;
  const previewClass = `mtp-preview ${presetClass(preset)}`;
  const presetDescription = PRESET_DESCRIPTIONS[preset];

  return (
    <ToolPage
      title="Markdown to PDF"
      tagline="Type markdown, pick a preset, save as PDF — browser-only, no upload."
      schema={SCHEMA}
      schemaId="markdown-to-pdf-schema"
      errorMessage="There was an error loading the markdown-to-pdf tool. Please refresh the page."
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
          <div className="mtp-toolbar">
            <div className="mtp-toolbar-left">
              <span className="mtp-meta">
                {charCount.toLocaleString()} character
                {charCount === 1 ? '' : 's'}
                {overCap && ' — exceeds auto-save limit, draft will not persist'}
              </span>
              <div className="mtp-preset-picker">
                <ModeToggle
                  ariaLabel="Print preset"
                  ariaDescribedBy="mtp-preset-description"
                  options={PRESET_OPTIONS}
                  value={preset}
                  onChange={handlePresetChange}
                />
                {presetDescription && (
                  <p id="mtp-preset-description" className="mtp-preset-description">
                    {presetDescription}
                  </p>
                )}
              </div>
            </div>
            <div className="mtp-toolbar-actions">
              {source.length === 0 && (
                <Button variant="info" onClick={handleInsertSample}>
                  Insert sample
                </Button>
              )}
              <Button
                variant="success"
                onClick={handleDownload}
                disabled={!canDownload}
              >
                Download as PDF
              </Button>
              <Button
                variant="neutral"
                onClick={handleClear}
                disabled={!canClear}
              >
                Clear
              </Button>
            </div>
          </div>
        </Card>

        <div className="mtp-split">
          <Card className="mtp-pane">
            <label className="mtp-pane-label" htmlFor="mtp-editor">
              Editor
            </label>
            <textarea
              ref={editorRef}
              id="mtp-editor"
              className="mtp-editor"
              value={source}
              onChange={handleChange}
              placeholder="# Start typing markdown…"
              spellCheck="true"
              aria-label="Markdown editor"
            />
          </Card>

          <Card className="mtp-pane">
            <span className="mtp-pane-label">Preview</span>
            {/* The preview/print container. Carries the active preset class
                so what the user sees on screen matches what prints. The id
                anchors the @media print selector that hides app chrome. */}
            <div
              id="mtp-print-root"
              className={previewClass}
              data-preset={preset}
              aria-label="Rendered markdown preview"
            >
              {html ? (
                <div
                  className="mtp-preview-body"
                  dangerouslySetInnerHTML={{__html: html}}
                />
              ) : (
                <div className="mtp-preview-body mtp-preview--empty">
                  The preview appears here as you type.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </ToolPage>
  );
}

export default function MarkdownToPdf() {
  return (
    <StorageProvider>
      <MarkdownToPdfContent />
    </StorageProvider>
  );
}
