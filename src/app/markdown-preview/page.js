'use client';
import {useDeferredValue, useEffect, useMemo, useRef, useState} from 'react';
import ToolPage from '../../components/ToolPage';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ToastContainer from '../../components/ToastContainer';
import {useToast} from '../../hooks/useToast';
import {useAutoSave} from '../../hooks/useAutoSave';
import {useHydrateStorage} from '../../hooks/useHydrateStorage';
import {useCopyToClipboard} from '../../hooks/useCopyToClipboard';
import {renderMarkdown} from '../../lib/markdown';
import {HAS_FIELD_SIZING} from '../../lib/featureDetect';
import {StorageProvider, useStorageData} from './StorageContext';
import {
  MAX_PERSISTED_CHARS,
  SAMPLE_DOCUMENT,
  STATE_AUTOSAVE_DEBOUNCE_MS,
} from './constants';
import './markdown-preview.css';

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Markdown Preview',
  description:
    'Free live markdown editor and renderer. Type GFM markdown on the left, see safe rendered HTML on the right — entirely in your browser.',
  url: 'https://auxbox.tools/markdown-preview',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Any',
  offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'},
};

function MarkdownPreviewContent() {
  const {toasts, showToast, dismissToast} = useToast();
  const {loadState, saveState, clearState, storageErrors} = useStorageData();

  const [source, setSource] = useState('');
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

  // Render the preview from the deferred value so typing latency stays
  // on the textarea side; the preview catches up on the next idle tick.
  const deferredSource = useDeferredValue(source);
  const html = useMemo(() => renderMarkdown(deferredSource), [deferredSource]);

  // Hydrate from storage once on mount.
  const hydrated = useHydrateStorage(() => {
    const saved = loadState();
    if (saved && typeof saved.document === 'string') {
      setSource(saved.document);
    }
  });

  useEffect(() => {
    if (storageErrors?.state) {
      showToast(`${storageErrors.state}. Using defaults.`, 'error');
    }
  }, [storageErrors?.state, showToast]);

  // Auto-save debounced. Skipped until the user types so a fresh-mount
  // no-interaction visit doesn't write defaults; and skipped over the
  // size cap so we don't trigger phantom "Failed to load" toasts.
  const {markDirty, markClean} = useAutoSave({
    enabled: hydrated && source.length <= MAX_PERSISTED_CHARS,
    deps: [source],
    onSave: () => saveState({document: source}),
    debounceMs: STATE_AUTOSAVE_DEBOUNCE_MS,
  });

  const copy = useCopyToClipboard({
    showToast,
    successMessage: 'HTML copied to clipboard',
    errorMessage: 'Could not copy to clipboard',
  });

  const handleChange = (e) => {
    markDirty();
    setSource(e.target.value);
  };

  const handleCopyHtml = async () => {
    // Render from the immediate source so we always copy the latest HTML
    // even if `useDeferredValue` is still mid-transition.
    const current = source.length > 0 ? renderMarkdown(source) : '';
    if (!current) {
      showToast('Nothing to copy yet', 'error');
      return;
    }
    const ok = await copy(current);
    if (ok) setAnnouncement('HTML copied to clipboard');
  };

  const handleClear = () => {
    // Synchronously wipe storage and mark clean so the post-Clear auto-save
    // effect skips the write — preventing a phantom {document: ''} record
    // from being written 300 ms later.
    clearState();
    setSource('');
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
  // Gate Copy on the immediate source — not the deferred html — so the
  // button enables on the same tick as the keystroke. The handler
  // re-renders via renderMarkdown(source) at click time so the copied
  // HTML is always current, not stuck on the previous deferred value.
  const canCopy = source.length > 0;
  const canClear = source.length > 0;

  return (
    <ToolPage
      title="Markdown Preview"
      tagline="Type markdown, see it rendered. Safe HTML, browser-only, auto-saved."
      schema={SCHEMA}
      schemaId="markdown-preview-schema"
      errorMessage="There was an error loading the markdown preview. Please refresh the page."
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
          <div className="mp-toolbar">
            <span className="mp-meta">
              {charCount.toLocaleString()} character{charCount === 1 ? '' : 's'}
              {overCap && ' — exceeds auto-save limit, draft will not persist'}
            </span>
            <div className="mp-toolbar-actions">
              {source.length === 0 && (
                <Button variant="info" onClick={handleInsertSample}>
                  Insert sample
                </Button>
              )}
              <Button
                variant="success"
                onClick={handleCopyHtml}
                disabled={!canCopy}
              >
                Copy as HTML
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

        <div className="mp-split">
          <Card className="mp-pane">
            <label className="mp-pane-label" htmlFor="mp-editor">
              Editor
            </label>
            <textarea
              ref={editorRef}
              id="mp-editor"
              className="mp-editor"
              value={source}
              onChange={handleChange}
              placeholder="# Start typing markdown…"
              spellCheck="true"
              aria-label="Markdown editor"
            />
          </Card>

          <Card className="mp-pane">
            <span className="mp-pane-label">Preview</span>
            {html ? (
              <div
                className="mp-preview"
                aria-label="Rendered markdown preview"
                dangerouslySetInnerHTML={{__html: html}}
              />
            ) : (
              <div
                className="mp-preview mp-preview--empty"
                aria-label="Rendered markdown preview"
              >
                The preview appears here as you type.
              </div>
            )}
          </Card>
        </div>
      </div>
    </ToolPage>
  );
}

export default function MarkdownPreview() {
  return (
    <StorageProvider>
      <MarkdownPreviewContent />
    </StorageProvider>
  );
}
