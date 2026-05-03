'use client';
import ToolPage from '../../components/ToolPage';
import Card from '../../components/Card';
import Button from '../../components/Button';
import DropZone from '../../components/DropZone';
import QualityControl from './components/QualityControl';
import DimensionInputs from './components/DimensionInputs';
import FileRow from './components/FileRow';
import {useImageCompressor} from './hooks';
import {MAX_FILE_BYTES, SUPPORTED_INPUT_TYPES} from './constants';
import {formatBytes} from '../../lib/format';
import './image-compressor.css';

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Image Compressor',
  description:
    'Free online image compressor. Drop JPEG, PNG, or WebP files, pick a quality, and download smaller versions. Files never leave your browser.',
  url: 'https://auxbox.tools/image-compressor',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Any',
  offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'},
};

const ACCEPT = SUPPORTED_INPUT_TYPES.join(',');

export default function ImageCompressor() {
  const {
    items,
    quality,
    setQuality,
    maxWidth,
    setMaxWidth,
    maxHeight,
    setMaxHeight,
    largestOriginalWidth,
    largestOriginalHeight,
    convertPngToWebp,
    setConvertPngToWebp,
    addFiles,
    removeItem,
    clearAll,
  } = useImageCompressor();

  const hasItems = items.length > 0;
  const hasDoneItems = items.some((it) => it.status === 'done');

  return (
    <ToolPage
      title="Image Compressor"
      tagline="Shrink JPEG, PNG, and WebP images — 100% in your browser, no uploads."
      schema={SCHEMA}
      schemaId="image-compressor-schema"
      narrow
      errorMessage="There was an error loading the image compressor. Please refresh the page."
    >
      <div className="ic-stack">
        <Card>
          <p className="ic-privacy">
            <strong>Files never leave your browser.</strong> Compression runs
            entirely on your device using the same image codecs the browser
            already ships. No uploads, no servers. Maximum file size:{' '}
            {formatBytes(MAX_FILE_BYTES)}.
          </p>
        </Card>

        <Card>
          <DropZone
            onFiles={addFiles}
            accept={ACCEPT}
            label="Drop images here, or click to choose"
            hint={`JPEG, PNG, or WebP — up to ${formatBytes(MAX_FILE_BYTES)} each`}
          />
        </Card>

        <Card>
          <div className="ic-controls">
            <QualityControl value={quality} onChange={setQuality} />
            <DimensionInputs
              maxWidth={maxWidth}
              maxHeight={maxHeight}
              onMaxWidthChange={setMaxWidth}
              onMaxHeightChange={setMaxHeight}
              largestOriginalWidth={largestOriginalWidth}
              largestOriginalHeight={largestOriginalHeight}
            />
            <div>
              <label className="ic-toggle">
                <input
                  type="checkbox"
                  checked={convertPngToWebp}
                  onChange={(e) => setConvertPngToWebp(e.target.checked)}
                />
                Convert PNG to WebP
              </label>
              <p className="ic-toggle-hint">
                Off keeps PNGs lossless. On re-encodes PNGs as WebP using the
                quality slider — usually much smaller, with minor visual loss.
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="ic-label" style={{margin: 0}}>
            Files {hasItems ? `(${items.length})` : ''}
          </h2>
          {hasItems ? (
            <div className="ic-list">
              {items.map((item) => (
                <FileRow key={item.id} item={item} onRemove={removeItem} />
              ))}
            </div>
          ) : (
            <p className="ic-list-empty">
              No files yet. Drop or pick some above to get started.
            </p>
          )}
          {hasItems && (
            <div className="ic-list-actions">
              <Button variant="warning" onClick={clearAll}>
                {hasDoneItems ? 'Clear all' : 'Cancel'}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </ToolPage>
  );
}
