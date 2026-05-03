import PropTypes from 'prop-types';
import Button from '../../../components/Button';
import {formatBytes} from '../../../lib/format';
import {savingsPct} from '../utils';

/**
 * Per-file row: name, original size, output size + savings, status, and
 * a per-row download button.
 */
export default function FileRow({item, onRemove}) {
  const {
    id,
    name,
    originalSize,
    status,
    error,
    outputBlob,
    outputUrl,
    outputName,
    outputSize,
    outputWidth,
    outputHeight,
  } = item;

  const pct = status === 'done' ? savingsPct(originalSize, outputSize) : 0;
  const pctLabel = formatPct(pct);

  return (
    <div className={`ic-row ic-row--${status}`} data-row-id={id}>
      <div className="ic-row-main">
        <div className="ic-row-name" title={name}>
          {name}
        </div>
        <div className="ic-row-meta">
          <span className="ic-row-size">{formatBytes(originalSize)}</span>
          {status === 'done' && (
            <>
              <span className="ic-row-arrow" aria-hidden="true">
                →
              </span>
              <span className="ic-row-size ic-row-size--out">
                {formatBytes(outputSize)}
              </span>
              <span
                className={`ic-row-savings ic-row-savings--${
                  pct >= 0 ? 'positive' : 'negative'
                }`}
              >
                {pctLabel}
              </span>
              {outputWidth && outputHeight && (
                <span className="ic-row-dims">
                  {outputWidth}×{outputHeight}
                </span>
              )}
            </>
          )}
        </div>
        <div className="ic-row-status" role="status" aria-live="polite">
          {status === 'queued' && 'Queued'}
          {status === 'encoding' && 'Compressing…'}
          {status === 'error' && (
            <span className="ic-row-error">{error}</span>
          )}
        </div>
      </div>
      <div className="ic-row-actions">
        {/* MIN-4: use <Button> polymorphic anchor so future Button changes apply here */}
        {status === 'done' && outputBlob && outputUrl && (
          <Button
            variant="success"
            href={outputUrl}
            download={outputName}
          >
            Download
          </Button>
        )}
        <Button variant="neutral" onClick={() => onRemove(id)}>
          Remove
        </Button>
      </div>
    </div>
  );
}

function formatPct(pct) {
  if (!Number.isFinite(pct)) return '';
  if (pct === 0) return '0%';
  const sign = pct > 0 ? '−' : '+';
  // Display absolute value with one decimal when small; integer otherwise.
  const abs = Math.abs(pct);
  const formatted = abs >= 10 ? abs.toFixed(0) : abs.toFixed(1);
  return `${sign}${formatted}%`;
}

FileRow.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    originalSize: PropTypes.number.isRequired,
    status: PropTypes.oneOf(['queued', 'encoding', 'done', 'error'])
      .isRequired,
    error: PropTypes.string,
    outputBlob: PropTypes.object,
    outputUrl: PropTypes.string,
    outputName: PropTypes.string,
    outputSize: PropTypes.number,
    outputWidth: PropTypes.number,
    outputHeight: PropTypes.number,
  }).isRequired,
  onRemove: PropTypes.func.isRequired,
};
