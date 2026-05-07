'use client';
import {useEffect, useRef, useState} from 'react';
import ToolPage from '../../components/ToolPage';
import Card from '../../components/Card';
import Button from '../../components/Button';
import DropZone from '../../components/DropZone';
import ToastContainer from '../../components/ToastContainer';
import {useToast} from '../../hooks/useToast';
import {useAutoSave} from '../../hooks/useAutoSave';
import {useHydrateStorage} from '../../hooks/useHydrateStorage';
import {useCopyToClipboard} from '../../hooks/useCopyToClipboard';
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

function buildHtmlSnippet(includeIco) {
  const lines = [];
  if (includeIco) {
    lines.push('<link rel="icon" type="image/x-icon" href="/favicon.ico" />');
  }
  lines.push('<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />');
  lines.push('<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />');
  lines.push('<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />');
  if (includeIco) {
    lines.push('<link rel="manifest" href="/site.webmanifest" />');
  }
  return lines.join('\n');
}

function FaviconGeneratorContent() {
  const {toasts, showToast, dismissToast} = useToast();
  const {loadState, saveState, clearState, storageErrors} = useStorageData();

  const [includeIco, setIncludeIco] = useState(DEFAULT_STATE.includeIco);
  const [background, setBackground] = useState(DEFAULT_STATE.background);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [sourceInfo, setSourceInfo] = useState(null); // {name, width, height}
  const [staleNotice, setStaleNotice] = useState(false);
  const previewUrlsRef = useRef([]);
  const genIdRef = useRef(0);

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

  // Stale-notice: when settings change AFTER a result exists.
  useEffect(() => {
    if (result !== null) {
      setStaleNotice(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [background, includeIco]);

  // Revoke preview object URLs on unmount only.
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

  const copy = useCopyToClipboard({showToast, dismissToast, successMessage: 'HTML snippet copied'});

  const handleFiles = async (files) => {
    const file = files?.[0];
    if (!file) return;
    if (!isSupportedImage(file)) {
      setError('Unsupported image type. Use PNG, JPEG, or WebP.');
      return;
    }
    setBusy(true);
    setError(null);
    setStaleNotice(false);
    releasePreviews();
    setResult(null);

    const myGen = ++genIdRef.current;

    // S11: JPEG (or any non-transparent format) can't carry alpha. If the user
    // selected 'transparent' for an opaque source, downgrade to 'white' for
    // this generation only so the output isn't unexpectedly opaque-black.
    const isOpaque =
      file.type !== 'image/png' && file.type !== 'image/webp';
    const effectiveBackground = isOpaque && background === 'transparent' ? 'white' : background;
    const opaqueHint = isOpaque && background === 'transparent';

    try {
      const out = await generateFavicons(file, {includeIco, background: effectiveBackground});

      // Race guard: if a newer drop started while we awaited, discard this result.
      if (myGen !== genIdRef.current) {
        // Revoke any blob URLs we'd create before they leak.
        return;
      }

      const localUrls = [];
      const tiles = out.pngs.map((p) => {
        const url = URL.createObjectURL(p.blob);
        localUrls.push(url);
        return {...p, url};
      });

      // Commit only after freshness confirmed.
      previewUrlsRef.current = localUrls;

      // Capture source dimensions from the first tile (pipeline uses bitmap dims).
      // We get them from the file itself via createImageBitmap in pipeline, but
      // we can derive them from the original file here for the hint display.
      // Instead, we'll use the file metadata returned from generateFavicons or
      // read the file before the pipeline. The pipeline returns pngs with size
      // property (output size, not source). Track source dims separately.
      const bitmapInfo = await createImageBitmapInfo(file);
      setSourceInfo({name: file.name, width: bitmapInfo.width, height: bitmapInfo.height});

      setResult({tiles, ico: out.ico, sourceName: file.name});
      if (opaqueHint) {
        showToast('JPEG source has no alpha — background set to white for this generation.', 'info');
      }
      showToast('Favicons generated', 'success');
    } catch (e) {
      setError(e?.message || 'Failed to generate favicons.');
    } finally {
      setBusy(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!result) return;
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      for (const tile of result.tiles) {
        zip.file(tile.filename, tile.blob);
      }
      if (result.ico) {
        zip.file('favicon.ico', result.ico);
      }
      // Add webmanifest.
      const webmanifest = JSON.stringify(
        {
          name: 'My App',
          short_name: 'App',
          icons: [
            {src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png'},
            {src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png'},
          ],
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
        },
        null,
        2
      );
      zip.file('site.webmanifest', webmanifest);

      const blob = await zip.generateAsync({type: 'blob'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'favicons.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Defer revoke — 60 s gives Safari + slow networks time to start the download.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      showToast('Zip downloaded', 'success');
    } catch (e) {
      showToast(e?.message || 'Failed to create zip.', 'error');
    }
  };

  const handleClear = () => {
    releasePreviews();
    setResult(null);
    setError(null);
    setSourceInfo(null);
    setStaleNotice(false);
    clearState();
    setIncludeIco(DEFAULT_STATE.includeIco);
    setBackground(DEFAULT_STATE.background);
    markClean();
    showToast('Cleared', 'success');
  };

  const htmlSnippet = buildHtmlSnippet(includeIco);

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
          <div aria-busy={busy}>
            <DropZone
              onFiles={handleFiles}
              accept={ACCEPT_ATTR}
              multiple={false}
              label="Drop an image, or click to pick"
              hint="PNG, JPEG, WebP. Square works best — non-square images are centre-cropped."
              disabled={busy}
            />
            {sourceInfo && !busy && (
              <p className="fg-hint">
                {sourceInfo.name} — {sourceInfo.width}×{sourceInfo.height}
                {(sourceInfo.width < 512 || sourceInfo.height < 512) &&
                  ' — favicons larger than the source will be upscaled.'}
              </p>
            )}
          </div>
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

        {busy && (
          <p role="status" aria-live="polite" className="fg-hint">
            Generating…
          </p>
        )}

        {result && (
          <Card>
            <h2 className="fg-card-title">Generated set</h2>
            {staleNotice && (
              <p className="fg-hint" role="status">
                Settings changed — re-drop the image to regenerate.
              </p>
            )}
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
              <div className="fg-tile">
                <div className="fg-tile-preview">
                  <span style={{fontSize: '0.7rem', color: 'var(--text-secondary)'}}>JSON</span>
                </div>
                <div className="fg-tile-label">Web app manifest</div>
                <div className="fg-tile-label">site.webmanifest</div>
              </div>
            </div>

            <div className="fg-snippet-wrap">
              <pre className="fg-snippet">{htmlSnippet}</pre>
              <Button variant="neutral" onClick={() => copy(htmlSnippet)}>
                Copy HTML snippet
              </Button>
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
      </div>
    </ToolPage>
  );
}

/**
 * Read source dimensions from a file without re-running the full pipeline.
 * Returns {width, height}. On failure returns {width: 0, height: 0}.
 */
async function createImageBitmapInfo(file) {
  try {
    const bm = await createImageBitmap(file);
    const {width, height} = bm;
    bm.close?.();
    return {width, height};
  } catch {
    return {width: 0, height: 0};
  }
}

export default function FaviconGenerator() {
  return (
    <StorageProvider>
      <FaviconGeneratorContent />
    </StorageProvider>
  );
}
