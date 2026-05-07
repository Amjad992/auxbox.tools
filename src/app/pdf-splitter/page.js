'use client';
import {useEffect, useMemo, useState} from 'react';
import ToolPage from '../../components/ToolPage';
import Card from '../../components/Card';
import Button from '../../components/Button';
import DropZone from '../../components/DropZone';
import InputField from '../../components/InputField';
import ToastContainer from '../../components/ToastContainer';
import {useToast} from '../../hooks/useToast';
import {useAutoSave} from '../../hooks/useAutoSave';
import {useHydrateStorage} from '../../hooks/useHydrateStorage';
import {formatBytes} from '../../lib/format';
import {parsePageRange} from '../../lib/pageRange';
import {StorageProvider, useStorageData} from './StorageContext';
import {
  DEFAULT_STATE,
  ERR_NOT_PDF,
  ERR_TOO_LARGE,
  MAX_FILE_BYTES,
  PDF_MIME,
  STATE_AUTOSAVE_DEBOUNCE_MS,
} from './constants';
import {extractPages, parsePdfMetadata} from './pipeline';
import './pdf-splitter.css';

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'PDF Splitter',
  description:
    'Extract pages or page ranges from a PDF entirely in your browser. No upload.',
  url: 'https://auxbox.tools/pdf-splitter',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Any',
  offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'},
};

function isPdfFile(file) {
  if (!file) return false;
  if (file.type === PDF_MIME) return true;
  if (!file.type) {
    const name = (file.name || '').toLowerCase();
    return name.endsWith('.pdf');
  }
  return false;
}

function PdfSplitterContent() {
  const {toasts, showToast, dismissToast} = useToast();
  const {loadState, saveState, clearState, storageErrors} = useStorageData();

  const [mode, setMode] = useState(DEFAULT_STATE.mode);
  const [file, setFile] = useState(null);
  const [arrayBuffer, setArrayBuffer] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [range, setRange] = useState('');
  const [busy, setBusy] = useState(false);
  const [parseError, setParseError] = useState(null);

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

  const {markClean} = useAutoSave({
    onSave: () => saveState({mode}),
    enabled: hydrated,
    deps: [mode],
    debounceMs: STATE_AUTOSAVE_DEBOUNCE_MS,
  });

  const handleFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const f = fileList[0];
    if (!isPdfFile(f)) {
      showToast(ERR_NOT_PDF, 'error');
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      showToast(ERR_TOO_LARGE, 'error');
      return;
    }
    setFile(f);
    setRange('');
    setParseError(null);
    setBusy(true);
    try {
      const buf = await f.arrayBuffer();
      const meta = await parsePdfMetadata(buf);
      if (meta.error) {
        setParseError(meta.message);
        setArrayBuffer(null);
        setPageCount(0);
      } else {
        setArrayBuffer(buf);
        setPageCount(meta.pageCount);
      }
    } catch (e) {
      setParseError(e?.message || 'Could not read this file.');
      setArrayBuffer(null);
      setPageCount(0);
    } finally {
      setBusy(false);
    }
  };

  const parsed = useMemo(() => {
    if (!arrayBuffer || pageCount < 1) return null;
    return parsePageRange(range, pageCount);
  }, [arrayBuffer, pageCount, range]);

  const rangeError = parsed && parsed.error ? parsed.error : null;
  const indices = parsed && !parsed.error ? parsed.indices : null;

  const handleExtract = async () => {
    if (!arrayBuffer || !indices || indices.length === 0) return;
    setBusy(true);
    try {
      const blob = await extractPages(arrayBuffer, indices);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const stem = (file?.name || 'document.pdf').replace(/\.pdf$/i, '');
      a.download = `${stem}-extract.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast(
        `Downloaded ${indices.length} ${
          indices.length === 1 ? 'page' : 'pages'
        }`,
        'success'
      );
    } catch (e) {
      setParseError(e?.message || 'Could not extract pages.');
    } finally {
      setBusy(false);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setArrayBuffer(null);
    setPageCount(0);
    setRange('');
    setParseError(null);
  };

  const handleClearAll = () => {
    handleClearFile();
    clearState();
    setMode(DEFAULT_STATE.mode);
    markClean();
    showToast('Cleared', 'success');
  };

  const canExtract =
    !!arrayBuffer && !!indices && indices.length > 0 && !busy;

  return (
    <ToolPage
      title="PDF Splitter"
      tagline="Drop a PDF, pick page ranges (e.g. 1-3,5,7-9), and download a new PDF with just those pages. Runs entirely in your browser — your file never leaves your device."
      schema={SCHEMA}
      schemaId="pdf-splitter-schema"
      errorMessage="There was an error loading the PDF splitter. Please refresh the page."
    >
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="tool-stack">
        <Card>
          <h2 className="ps-card-title">Source PDF</h2>
          <p className="ps-card-hint">
            Drop a single PDF or click to pick one. Files are read into
            memory locally — never uploaded.
          </p>
          <DropZone
            onFiles={handleFiles}
            multiple={false}
            accept="application/pdf,.pdf"
            label="Drop a PDF or click to pick one"
            hint={`Up to ${formatBytes(MAX_FILE_BYTES)}.`}
            disabled={busy}
          />
          {file && (
            <>
              <div className="ps-file-info">
                <p className="ps-file-name">{file.name}</p>
                <span className="ps-file-size">{formatBytes(file.size)}</span>
                {pageCount > 0 && (
                  <span className="ps-file-pages">
                    {pageCount} {pageCount === 1 ? 'page' : 'pages'}
                  </span>
                )}
              </div>
              <div className="ps-file-actions">
                <Button variant="neutral" onClick={handleClearFile}>
                  Clear file
                </Button>
              </div>
            </>
          )}
          {parseError && (
            <p className="ps-error" role="alert">
              {parseError}
            </p>
          )}
        </Card>

        {arrayBuffer && pageCount > 0 && (
          <Card>
            <h2 className="ps-card-title">Pages to extract</h2>
            <div className="ps-range-row">
              <InputField
                id="ps-range"
                label="Page range"
                helper={`Examples: 1-3 · 1,3,5 · 1-3,5,7-9 · empty = all ${pageCount} pages.`}
                error={rangeError || ''}
                type="text"
                value={range}
                onChange={(e) => setRange(e.target.value)}
                placeholder={`1-${pageCount}`}
                spellCheck={false}
                autoComplete="off"
                inputClassName="tool-field-input--mono"
              />
            </div>
            <div className="ps-actions">
              <Button
                variant="primary"
                onClick={handleExtract}
                disabled={!canExtract}
              >
                {busy
                  ? 'Working…'
                  : indices && indices.length > 0
                    ? `Download ${indices.length} ${
                        indices.length === 1 ? 'page' : 'pages'
                      }`
                    : 'Extract'}
              </Button>
            </div>
          </Card>
        )}

        <div className="ps-actions">
          <Button variant="neutral" onClick={handleClearAll}>
            Clear all
          </Button>
        </div>
      </div>
    </ToolPage>
  );
}

export default function PdfSplitter() {
  return (
    <StorageProvider>
      <PdfSplitterContent />
    </StorageProvider>
  );
}
