'use client';
import {useEffect, useRef, useState} from 'react';
import JSZip from 'jszip';
import ToolPage from '../../components/ToolPage';
import Card from '../../components/Card';
import Button from '../../components/Button';
import DropZone from '../../components/DropZone';
import ToastContainer from '../../components/ToastContainer';
import {useToast} from '../../hooks/useToast';
import {useAutoSave} from '../../hooks/useAutoSave';
import {useHydrateStorage} from '../../hooks/useHydrateStorage';
import {ACCEPT_ATTR, isSupportedImage} from '../../lib/image';
import {StorageProvider, useStorageData} from './StorageContext';
import {
  BACKGROUND_OPTIONS,
  DEFAULT_STATE,
  FAVICON_SIZES,
  STATE_AUTOSAVE_DEBOUNCE_MS,
} from './constants';
import {generateFavicons} from './pipeline';
import './favicon-generator.css';

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Favicon Generator',
  description:
    'Free favicon generator. Upload one image and download the full favicon set as a zip.',
  url: 'https://auxbox.tools/favicon-generator',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Any',
  offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'},
};

function FaviconGeneratorContent() {
  const {toasts, showToast, dismissToast} = useToast();
  const {loadState, saveState, clearState, storageErrors} = useStorageData();

  const [includeIco, setIncludeIco] = useState(DEFAULT_STATE.includeIco);
  const [background, setBackground] = useState(DEFAULT_STATE.background);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const previewUrlsRef = useRef([]);

  const hydrated = useHydrateStorage(() => {
    const saved = loadState();
    if (saved && typeof saved === 'object') {
      setIncludeIco(saved.includeIco);
      setBackground(saved.background);
    }
  });

  useEffect(() => {
    if (storageErrors?.state) {
      showToast(`${storageErrors.state}. Using defaults.`, 'error');
    }
  }, [storageErrors?.state, showToast]);

  const {markDirty, markClean} = useAutoSave({
    onSave: () => saveState({includeIco, background}),
    enabled: hydrated,
    deps: [includeIco, background],
    debounceMs: STATE_AUTOSAVE_DEBOUNCE_MS,
  });

  // Revoke preview object URLs on unmount or when result is replaced.
  useEffect(() => {
    return () => {
      for (const u of previewUrlsRef.current) URL.revokeObjectURL(u);
      previewUrlsRef.current = [];
    };
  }, []);

  const releasePreviews = () => {
    for (const u of previewUrlsRef.current) URL.revokeObjectURL(u);
    previewUrlsRef.current = [];
  };

  const handleFiles = async (files) => {
    const file = files?.[0];
    if (!file) return;
    if (!isSupportedImage(file)) {
      setError('Unsupported image type. Use PNG, JPEG, or WebP.');
      return;
    }
    setBusy(true);
    setError(null);
    releasePreviews();
    try {
      const out = await generateFavicons(file, {includeIco, background});
      const tiles = out.pngs.map((p) => {
        const url = URL.createObjectURL(p.blob);
        previewUrlsRef.current.push(url);
        return {...p, url};
      });
      setResult({tiles, ico: out.ico, sourceName: file.name});
      showToast('Favicons generated', 'success');
    } catch (e) {
      setError(e?.message || 'Failed to generate favicons.');
    } finally {
      setBusy(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!result) return;
    const zip = new JSZip();
    for (const tile of result.tiles) {
      zip.file(tile.filename, tile.blob);
    }
    if (result.ico) {
      zip.file('favicon.ico', result.ico);
    }
    const blob = await zip.generateAsync({type: 'blob'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'favicons.zip';
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Defer revoke until next tick so the browser has a chance to start the download.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleClear = () => {
    releasePreviews();
    setResult(null);
    setError(null);
    clearState();
    setIncludeIco(DEFAULT_STATE.includeIco);
    setBackground(DEFAULT_STATE.background);
    markClean();
    showToast('Cleared', 'success');
  };

  return (
    <ToolPage
      title="Favicon Generator"
      tagline="Upload one image. Get the full favicon set (16, 32, 180, 192, 512) plus an ICO bundle. Runs entirely in your browser."
      schema={SCHEMA}
      schemaId="favicon-generator-schema"
      errorMessage="There was an error loading the favicon generator. Please refresh the page."
    >
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="tool-stack">
        <Card>
          <h2 className="fg-card-title">Source image</h2>
          <DropZone
            onFiles={handleFiles}
            accept={ACCEPT_ATTR}
            multiple={false}
            label="Drop an image, or click to pick"
            hint="PNG, JPEG, WebP. Square works best — non-square images are centre-cropped."
            disabled={busy}
          />
        </Card>

        <Card>
          <div className="fg-controls">
            <div className="tool-field">
              <label htmlFor="fg-bg" className="tool-field-label">
                Background
              </label>
              <select
                id="fg-bg"
                className="tool-select"
                value={background}
                onChange={(e) => {
                  markDirty();
                  setBackground(e.target.value);
                }}
              >
                {BACKGROUND_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <label className="fg-toggle">
              <input
                type="checkbox"
                checked={includeIco}
                onChange={(e) => {
                  markDirty();
                  setIncludeIco(e.target.checked);
                }}
              />
              Include favicon.ico (16/32/48 multi-resolution)
            </label>
          </div>
        </Card>

        {error && (
          <p className="tool-error" role="alert">
            {error}
          </p>
        )}

        {result && (
          <Card>
            <h2 className="fg-card-title">Generated set</h2>
            <div className="fg-results">
              {result.tiles.map((t) => {
                const spec = FAVICON_SIZES.find((s) => s.size === t.size);
                return (
                  <div key={t.filename} className="fg-tile">
                    <div className="fg-tile-preview">
                      {/* Object URL → no Next/Image optimisation possible. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={t.url} alt={`${t.size}×${t.size} preview`} />
                    </div>
                    <div className="fg-tile-label">{spec?.label ?? `${t.size}×${t.size}`}</div>
                    <div className="fg-tile-label">{t.filename}</div>
                  </div>
                );
              })}
              {result.ico && (
                <div className="fg-tile">
                  <div className="fg-tile-preview">
                    <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>ICO</span>
                  </div>
                  <div className="fg-tile-label">16/32/48 multi-res</div>
                  <div className="fg-tile-label">favicon.ico</div>
                </div>
              )}
            </div>
            <div className="fg-actions">
              <Button variant="primary" onClick={handleDownloadZip}>
                ⬇ Download zip
              </Button>
              <Button variant="neutral" onClick={handleClear}>
                Clear
              </Button>
            </div>
          </Card>
        )}

        {busy && (
          <p role="status" aria-live="polite" className="cjc-hint">
            Generating…
          </p>
        )}
      </div>
    </ToolPage>
  );
}

export default function FaviconGenerator() {
  return (
    <StorageProvider>
      <FaviconGeneratorContent />
    </StorageProvider>
  );
}
