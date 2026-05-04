'use client';
import {useDeferredValue, useEffect, useMemo, useRef, useState} from 'react';
import ToolPage from '../../components/ToolPage';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ToastContainer from '../../components/ToastContainer';
import {useToast} from '../../hooks/useToast';
import {renderMarkdown} from '../../lib/markdown';
import {copyToClipboard} from '../../lib/clipboard';
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
  const [hydrated, setHydrated] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  // Tracks whether the user has taken any persisted action so a fresh-mount
  // visit with no interaction does NOT write defaults to localStorage.
  const dirtyRef = useRef(false);

  // Ref for the editor textarea — used by the autosize fallback effect.
  const editorRef = useRef(null);

  // Autosize fallback for browsers without `field-sizing: content`.
  // CSS handles modern Chromium/Safari for free; this effect covers the rest.
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [source]);

  // Render the preview from the deferred value so typing latency stays
  // on the textarea side; the preview catches up on the next idle tick.
  const deferredSource = useDeferredValue(source);
  const html = useMemo(() => renderMarkdown(deferredSource), [deferredSource]);

  // Hydrate from storage once on mount.
  useEffect(() => {
    const saved = loadState();
    if (saved && typeof saved.document === 'string') {
      setSource(saved.document);
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (storageErrors?.state) {
      showToast(`${storageErrors.state}. Using defaults.`, 'error');
    }
  }, [storageErrors?.state, showToast]);

  // Auto-save debounced. Skipped until the user types (dirtyRef) so a
  // fresh-mount no-interaction visit doesn't write defaults.
  useEffect(() => {
    if (!hydrated || !dirtyRef.current) return;
    if (source.length > MAX_PERSISTED_CHARS) return;
    const handle = setTimeout(() => {
      saveState({document: source});
    }, STATE_AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [hydrated, source, saveState]);

  const handleChange = (e) => {
    dirtyRef.current = true;
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
    const ok = await copyToClipboard(current);
    if (ok) {
      showToast('HTML copied to clipboard', 'success');
      setAnnouncement('HTML copied to clipboard');
    } else {
      showToast('Could not copy to clipboard', 'error');
    }
  };

  const handleClear = () => {
    // Synchronously wipe storage and reset dirty so the post-Clear
    // auto-save effect skips the write — preventing a phantom
    // {document: ''} record from being written 300 ms later.
    clearState();
    setSource('');
    dirtyRef.current = false;
    setAnnouncement('Document cleared');
    showToast('Document cleared', 'success');
  };

  const handleInsertSample = () => {
    dirtyRef.current = true;
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
        className="mp-sr-only"
      >
        {announcement}
      </p>

      <div className="mp-stack">
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
