'use client';
import {useCallback, useRef, useState} from 'react';
import ToolPage from '../../components/ToolPage';
import Card from '../../components/Card';
import Button from '../../components/Button';
import DropZone from '../../components/DropZone';
import PdfFileRow from './components/PdfFileRow';
import {usePdfMerger} from './hooks';
import {MAX_FILE_BYTES, MAX_FILES, PDF_MIME} from './constants';
import {formatBytes} from '../../lib/format';
import './pdf-merger.css';


const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'PDF Merger',
  description:
    'Free online PDF merger. Drop PDFs, drag to reorder, optionally pick page ranges, and download a single combined PDF. Files never leave your browser.',
  url: 'https://auxbox.tools/pdf-merger',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Any',
  offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'},
};

export default function PdfMerger() {
  const {
    files,
    rejections,
    fileRangeErrors,
    canMerge,
    mergeStatus,
    mergeError,
    mergedCount,
    addFiles,
    removeFile,
    moveFile,
    setPageRange,
    clearAll,
    dismissRejections,
    merge,
  } = usePdfMerger();

  // HTML5 native drag-and-drop state. `dragIndex` holds the source row
  // during a drag; `overIndex` is the row being hovered over.
  const dragIndexRef = useRef(null);
  const [draggingId, setDraggingId] = useState(null);

  const handleDragStart = useCallback((e, index) => {
    dragIndexRef.current = index;
    setDraggingId(files[index]?.id ?? null);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      // Some browsers need a payload to start the drag.
      try {
        e.dataTransfer.setData('text/plain', String(index));
      } catch (_e) {
        // Safari throws for some MIME types in jsdom; ignore.
      }
    }
  }, [files]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (e, index) => {
      e.preventDefault();
      const from = dragIndexRef.current;
      if (from == null || from === index) return;
      moveFile(from, index);
    },
    [moveFile]
  );

  const handleDragEnd = useCallback(() => {
    dragIndexRef.current = null;
    setDraggingId(null);
  }, []);

  const handleMoveUp = useCallback(
    (index) => moveFile(index, index - 1),
    [moveFile]
  );
  const handleMoveDown = useCallback(
    (index) => moveFile(index, index + 1),
    [moveFile]
  );

  const handleMerge = useCallback(async () => {
    await merge();
  }, [merge]);

  const liveMessage = (() => {
    if (mergeStatus === 'merging') return 'Merging PDFs…';
    if (mergeStatus === 'success')
      return `Merged ${mergedCount} files into a combined PDF. Download started.`;
    return '';
  })();

  return (
    <ToolPage
      title="PDF Merger"
      tagline="Combine PDFs in your browser — drag to reorder, pick page ranges, download. Nothing uploaded."
      schema={SCHEMA}
      schemaId="pdf-merger-schema"
      narrow
      errorMessage="There was an error loading the PDF merger. Please refresh the page."
    >
      <div className="pm-stack">
        <Card>
          <p className="pm-privacy">
            <strong>Files never leave your browser.</strong> Merging runs
            entirely on your device using the open-source pdf-lib library. No
            uploads, no servers. Up to {MAX_FILES} files,{' '}
            {formatBytes(MAX_FILE_BYTES)} each.
          </p>
        </Card>

        <Card>
          <DropZone
            onFiles={addFiles}
            accept={PDF_MIME}
            label="Drop PDFs here, or click to choose"
            hint={`Up to ${MAX_FILES} files, ${formatBytes(MAX_FILE_BYTES)} each. Files never leave your browser.`}
          />
        </Card>

        {rejections.length > 0 && (
          <div role="alert" className="pm-rejections">
            <strong>
              {rejections.length} file{rejections.length === 1 ? '' : 's'} could
              not be added:
            </strong>
            <ul className="pm-rejections-list">
              {rejections.map((r, idx) => (
                <li key={`${r.file.name}-${idx}`}>
                  <strong>{r.file.name || 'untitled'}:</strong> {r.reason}
                </li>
              ))}
            </ul>
            <div style={{marginTop: '0.5rem'}}>
              <Button variant="neutral" onClick={dismissRejections}>
                Dismiss
              </Button>
            </div>
          </div>
        )}

        <Card>
          <h2 className="pm-section-heading">
            Files {files.length > 0 ? `(${files.length}/${MAX_FILES})` : ''}
          </h2>
          {files.length === 0 ? (
            <p className="pm-list-empty">
              No files yet. Drop or pick PDFs above to get started.
            </p>
          ) : (
            <>
              <p className="pm-list-hint">
                Drag rows to reorder, or use the ↑/↓ buttons.
              </p>
              <div className="pm-list">
                {files.map((item, index) => (
                  <PdfFileRow
                    key={item.id}
                    item={item}
                    index={index}
                    total={files.length}
                    rangeError={fileRangeErrors[index]}
                    onRemove={removeFile}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    onPageRangeChange={setPageRange}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    isDragging={draggingId === item.id}
                  />
                ))}
              </div>
            </>
          )}

          {files.length > 0 && (
            <>
              {mergeError && (
                <p className="pm-merge-error" role="alert">
                  {mergeError}
                </p>
              )}
              <div
                className="pm-merge-row"
                style={{marginTop: '1rem'}}
              >
                <Button variant="neutral" onClick={clearAll}>
                  Clear all
                </Button>
                <Button
                  variant="primary"
                  onClick={handleMerge}
                  disabled={!canMerge}
                >
                  {mergeStatus === 'merging' ? 'Merging…' : 'Merge PDFs'}
                </Button>
              </div>
            </>
          )}

          <div role="status" aria-live="polite" className="pm-live-region">
            {liveMessage}
          </div>
        </Card>
      </div>
    </ToolPage>
  );
}
