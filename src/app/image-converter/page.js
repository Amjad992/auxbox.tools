'use client';
import {useEffect, useMemo, useState} from 'react';
import ToolPage from '../../components/ToolPage';
import Card from '../../components/Card';
import Button from '../../components/Button';
import DropZone from '../../components/DropZone';
import Slider from '../../components/Slider';
import ToastContainer from '../../components/ToastContainer';
import {useToast} from '../../hooks/useToast';
import {useAutoSave} from '../../hooks/useAutoSave';
import {useHydrateStorage} from '../../hooks/useHydrateStorage';
import {formatBytes, formatPercent} from '../../lib/format';
import {extensionForMime, savingsPct as calcSavingsPct} from '../../lib/image';
import {StorageProvider, useStorageData} from './StorageContext';
import {
  ACCEPT_ATTR,
  DEFAULT_STATE,
  ERR_NOT_IMAGE,
  ERR_TOO_LARGE,
  MAX_FILE_BYTES,
  PNG_MIME,
  STATE_AUTOSAVE_DEBOUNCE_MS,
  TARGET_OPTIONS,
} from './constants';
import {convertImage, isSupportedImage, mimeForFile} from './pipeline';
import './image-converter.css';

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Image Format Converter',
  description:
    'Convert between PNG, JPEG, and WebP entirely in your browser. No upload.',
  url: 'https://auxbox.tools/image-converter',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Any',
  offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'},
};

function ImageConverterContent() {
  const {toasts, showToast, dismissToast} = useToast();
  const {loadState, saveState, clearState, storageErrors} = useStorageData();

  const [target, setTarget] = useState(DEFAULT_STATE.target);
  const [quality, setQuality] = useState(DEFAULT_STATE.quality);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const hydrated = useHydrateStorage(() => {
    const saved = loadState();
    if (saved && typeof saved === 'object') {
      if (typeof saved.target === 'string') setTarget(saved.target);
      if (typeof saved.quality === 'number') setQuality(saved.quality);
    }
  });

  useEffect(() => {
    if (storageErrors?.state) {
      showToast(`${storageErrors.state}. Using defaults.`, 'error');
    }
  }, [storageErrors?.state, showToast]);

  const {markDirty, markClean} = useAutoSave({
    onSave: () => saveState({target, quality}),
    enabled: hydrated,
    deps: [target, quality],
    debounceMs: STATE_AUTOSAVE_DEBOUNCE_MS,
  });

  const handleFiles = (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const f = fileList[0];
    if (!isSupportedImage(f)) {
      showToast(ERR_NOT_IMAGE, 'error');
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      showToast(`${ERR_TOO_LARGE} (max ${formatBytes(MAX_FILE_BYTES)})`, 'error');
      return;
    }
    setFile(f);
    setResult(null);
    setError(null);
  };

  const sourceMime = file ? mimeForFile(file) : '';

  const handleConvert = async () => {
    if (!file || busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = await convertImage(file, {target, quality});
      setResult(r);
    } catch (e) {
      setError(e?.message || 'Could not convert this image.');
      setResult(null);
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    const stem = (file?.name || 'image').replace(/\.[^/.]+$/, '');
    a.download = `${stem}.${extensionForMime(result.mimeType)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Downloaded', 'success');
  };

  const handleClearFile = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  const handleClearAll = () => {
    handleClearFile();
    clearState();
    setTarget(DEFAULT_STATE.target);
    setQuality(DEFAULT_STATE.quality);
    markClean();
    showToast('Cleared', 'success');
  };

  const handleTargetChange = (next) => {
    markDirty();
    setTarget(next);
    setResult(null);
  };

  const handleQualityChange = (next) => {
    markDirty();
    setQuality(next);
    setResult(null);
  };

  const savingsPct = useMemo(() => {
    if (!result || !file) return null;
    return calcSavingsPct(file.size, result.blob.size);
  }, [file, result]);

  const showQualitySlider = target !== PNG_MIME;

  return (
    <ToolPage
      title="Image Format Converter"
      tagline="Convert between PNG, JPEG, and WebP. Browser-only — your image never leaves your device."
      schema={SCHEMA}
      schemaId="image-converter-schema"
      errorMessage="There was an error loading the image converter. Please refresh the page."
    >
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="tool-stack">
        <Card>
          <h2 className="ic2-card-title">Source image</h2>
          <p className="ic2-card-hint">
            Drop a PNG, JPEG, or WebP. Files are decoded locally — never uploaded.
          </p>
          <DropZone
            onFiles={handleFiles}
            multiple={false}
            accept={ACCEPT_ATTR}
            label="Drop an image or click to pick one"
            hint={`Up to ${formatBytes(MAX_FILE_BYTES)}.`}
            disabled={busy}
          />
          {file && (
            <>
              <div className="ic2-file-info">
                <p className="ic2-file-name">{file.name}</p>
                <span className="ic2-file-size">{formatBytes(file.size)}</span>
                <span className="ic2-file-mime">{sourceMime}</span>
              </div>
              <div className="ic2-file-actions">
                <Button variant="neutral" onClick={handleClearFile}>
                  Clear file
                </Button>
              </div>
            </>
          )}
        </Card>

        <Card>
          <h2 className="ic2-card-title">Target format</h2>
          <fieldset className="ic2-formats">
            <legend className="tool-sr-only">Target format</legend>
            {TARGET_OPTIONS.map((opt) => {
              const active = target === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`ic2-format-button${
                    active ? ' ic2-format-button--active' : ''
                  }`}
                  onClick={() => handleTargetChange(opt.value)}
                  aria-pressed={active}
                >
                  {opt.label}
                </button>
              );
            })}
          </fieldset>

          {showQualitySlider && (
            <div style={{marginTop: '1rem'}}>
              <Slider
                id="ic2-quality"
                label="Quality"
                value={quality}
                min={0.1}
                max={1}
                step={0.05}
                integerOnly={false}
                onChange={handleQualityChange}
                formatValue={(v) => `${Math.round(v * 100)}%`}
                leftHint="10%"
                rightHint="100%"
              />
            </div>
          )}
          {!showQualitySlider && (
            <p className="ic2-empty" style={{marginTop: '0.5rem'}}>
              PNG is lossless — quality is fixed.
            </p>
          )}
        </Card>

        <Card>
          <h2 className="ic2-card-title">Convert</h2>
          {!file ? (
            <p className="ic2-empty">Drop an image above to convert.</p>
          ) : (
            <>
              <div className="ic2-actions">
                <Button
                  variant="primary"
                  onClick={handleConvert}
                  disabled={busy}
                  aria-busy={busy}
                >
                  {busy ? 'Converting…' : 'Convert'}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDownload}
                  disabled={!result || busy}
                >
                  Download
                </Button>
              </div>
              <div className="ic2-result-region" aria-live="polite" aria-atomic="true">
                {result && (
                  <div className="ic2-result">
                    <div className="ic2-result-row ic2-result-row--muted">
                      <span>Source</span>
                      <span className="ic2-result-amount">
                        {formatBytes(file.size)} · {sourceMime}
                      </span>
                    </div>
                    <div className="ic2-result-row">
                      <span>Output</span>
                      <span className="ic2-result-amount">
                        {formatBytes(result.blob.size)} · {result.mimeType} ·{' '}
                        {result.width}×{result.height}
                      </span>
                    </div>
                    {savingsPct != null && (
                      <div className="ic2-result-row ic2-result-row--muted">
                        <span>Size change</span>
                        <span
                          className={`ic2-savings${
                            savingsPct < 0 ? ' ic2-savings--negative' : ''
                          }`}
                        >
                          {formatPercent(savingsPct)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {error && (
                  <p className="ic2-error" role="alert">
                    {error}
                  </p>
                )}
              </div>
            </>
          )}
        </Card>

        <div className="ic2-actions">
          <Button variant="neutral" onClick={handleClearAll}>
            Clear all
          </Button>
        </div>
      </div>
    </ToolPage>
  );
}

export default function ImageConverter() {
  return (
    <StorageProvider>
      <ImageConverterContent />
    </StorageProvider>
  );
}
