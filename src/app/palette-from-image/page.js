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
import {ACCEPT_ATTR, MAX_PIXELS, isSupportedImage} from '../../lib/image';
import {StorageProvider, useStorageData} from './StorageContext';
import {
  DEFAULT_STATE,
  FORMAT_OPTIONS,
  MAX_COLOURS,
  MAX_SAMPLE_PIXELS,
  MIN_COLOURS,
  STATE_AUTOSAVE_DEBOUNCE_MS,
} from './constants';
import {extractPixels, medianCut} from './quantize';
import {formatColour, paletteToText, readableTextOn} from './utils';
import './palette-from-image.css';

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Palette from Image',
  description:
    'Extract dominant colors from any image. Hex, RGB, or nearest Tailwind class names.',
  url: 'https://auxbox.tools/palette-from-image',
  applicationCategory: 'DesignApplication',
  operatingSystem: 'Any',
  offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'},
};

function PaletteFromImageContent() {
  const {toasts, showToast, dismissToast} = useToast();
  const {loadState, saveState, clearState, storageErrors} = useStorageData();

  const [colourCount, setColourCount] = useState(DEFAULT_STATE.colourCount);
  const [format, setFormat] = useState(DEFAULT_STATE.format);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [palette, setPalette] = useState(null);
  const [sourceInfo, setSourceInfo] = useState(null);
  const lastFileRef = useRef(null);
  const genIdRef = useRef(0);

  const hydrated = useHydrateStorage(() => {
    const saved = loadState();
    if (saved && typeof saved === 'object') {
      setColourCount(saved.colourCount);
      setFormat(saved.format);
    }
  });

  useEffect(() => {
    if (storageErrors?.state) {
      showToast(`${storageErrors.state}. Using defaults.`, 'error');
    }
  }, [storageErrors?.state, showToast]);

  const {markDirty, markClean} = useAutoSave({
    onSave: () => saveState({colourCount, format}),
    enabled: hydrated,
    deps: [colourCount, format],
    debounceMs: STATE_AUTOSAVE_DEBOUNCE_MS,
  });

  const runExtraction = async (file, count) => {
    setBusy(true);
    setError(null);
    const myGen = ++genIdRef.current;
    let bitmap;
    try {
      bitmap = await createImageBitmap(file, {imageOrientation: 'from-image'});
      const bw = bitmap.width;
      const bh = bitmap.height;
      if (bw * bh > MAX_PIXELS) {
        throw new Error(
          `Image is too large (${bw}×${bh}). Maximum is ${Math.round(MAX_PIXELS / 1_000_000)} MP.`
        );
      }
      const pixels = extractPixels(bitmap, MAX_SAMPLE_PIXELS);
      const result = medianCut(pixels, count);
      if (myGen !== genIdRef.current) return;
      if (result.length === 0) {
        throw new Error('Could not extract any colours (image fully transparent?).');
      }
      setPalette(result);
      setSourceInfo({name: file.name, width: bw, height: bh});
    } catch (e) {
      if (myGen === genIdRef.current) {
        setError(e?.message || 'Failed to extract palette.');
      }
    } finally {
      bitmap?.close?.();
      setBusy(false);
    }
  };

  const handleFiles = async (files) => {
    const file = files?.[0];
    if (!file) return;
    if (!isSupportedImage(file)) {
      setError('Unsupported image type. Use PNG, JPEG, or WebP.');
      return;
    }
    lastFileRef.current = file;
    await runExtraction(file, colourCount);
  };

  // Re-extract when colour count changes after a file is loaded.
  useEffect(() => {
    if (!lastFileRef.current || !palette) return;
    runExtraction(lastFileRef.current, colourCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colourCount]);

  const copy = useCopyToClipboard({showToast});

  const handleCopyAll = () => {
    if (!palette) return;
    copy(paletteToText(palette, format), {successMessage: 'Palette copied'});
  };

  const handleClear = () => {
    setPalette(null);
    setSourceInfo(null);
    setError(null);
    lastFileRef.current = null;
    clearState();
    setColourCount(DEFAULT_STATE.colourCount);
    setFormat(DEFAULT_STATE.format);
    markClean();
    showToast('Cleared', 'success');
  };

  return (
    <ToolPage
      title="Palette from Image"
      tagline="Upload an image. Extract its dominant colours via median-cut quantization. Output as hex, RGB, or nearest Tailwind class."
      schema={SCHEMA}
      schemaId="palette-from-image-schema"
      errorMessage="There was an error loading the palette extractor. Please refresh the page."
    >
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="tool-stack">
        <Card>
          <div aria-busy={busy}>
            <h2 className="pfi-card-title">Source image</h2>
            <DropZone
              onFiles={handleFiles}
              accept={ACCEPT_ATTR}
              multiple={false}
              label="Drop an image, or click to pick"
              hint="PNG, JPEG, WebP. Larger images are sampled down for speed."
              disabled={busy}
            />
            {sourceInfo && (
              <p className="pfi-meta" role="status" aria-live="polite">
                <code>{sourceInfo.name}</code> — {sourceInfo.width}×{sourceInfo.height} px
              </p>
            )}
          </div>
        </Card>

        <Card>
          <div className="pfi-controls">
            <div className="tool-field">
              <label htmlFor="pfi-count" className="tool-field-label">
                Colours ({MIN_COLOURS}–{MAX_COLOURS})
              </label>
              <input
                id="pfi-count"
                type="number"
                className="tool-field-input"
                min={MIN_COLOURS}
                max={MAX_COLOURS}
                value={colourCount}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  if (Number.isInteger(n) && n >= MIN_COLOURS && n <= MAX_COLOURS) {
                    markDirty();
                    setColourCount(n);
                  }
                }}
              />
            </div>
            <div className="tool-field">
              <label htmlFor="pfi-format" className="tool-field-label">
                Format
              </label>
              <select
                id="pfi-format"
                className="tool-select"
                value={format}
                onChange={(e) => {
                  markDirty();
                  setFormat(e.target.value);
                }}
              >
                {FORMAT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {error && (
          <p className="tool-error" role="alert">
            {error}
          </p>
        )}

        {busy && (
          <p role="status" aria-live="polite" className="pfi-hint">
            Extracting palette…
          </p>
        )}

        {palette && (
          <Card>
            <h2 className="pfi-card-title">Palette ({palette.length})</h2>
            <div className="pfi-swatches">
              {palette.map((c, i) => {
                const label = formatColour(c, format);
                const bg = `rgb(${c.r}, ${c.g}, ${c.b})`;
                const fg = readableTextOn(c);
                return (
                  <button
                    key={`${c.r}-${c.g}-${c.b}-${i}`}
                    type="button"
                    className="pfi-swatch"
                    onClick={() => copy(label, {successMessage: `${label} copied`})}
                    aria-label={`Copy ${label}`}
                    title="Click to copy"
                  >
                    <span
                      className="pfi-swatch-color"
                      style={{background: bg, color: fg}}
                      aria-hidden="true"
                    />
                    <span className="pfi-swatch-label">{label}</span>
                  </button>
                );
              })}
            </div>
            <div className="pfi-actions">
              <Button variant="primary" onClick={handleCopyAll}>
                Copy all
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

export default function PaletteFromImage() {
  return (
    <StorageProvider>
      <PaletteFromImageContent />
    </StorageProvider>
  );
}
