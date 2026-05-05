import PropTypes from 'prop-types';
import Button from '../../../components/Button';
import {formatBytes} from '../../../lib/format';
import {savingsPct} from '../utils';

/**
 * Per-file row: name, original size, output size + savings, status, and
 * a per-row download button.
 *
 * Issue 4 — layout stability: the Download button is kept mounted whenever
 * outputBlob/outputUrl exist, regardless of status. During re-encode the
 * button is disabled and shows a spinner label. The meta/status line is
 * always rendered (as a fixed-height flex row) so the row bounding box never
 * changes height while cycling through queued → encoding → done.
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

  const isEncoding = status === 'encoding' || status === 'queued';
  const isDone = status === 'done';
  const isError = status === 'error';

  const pct = outputSize != null ? savingsPct(originalSize, outputSize) : 0;
  const pctLabel = formatPct(pct);

  // Whether we have a valid previous or current result to show.
  const hasOutput = outputBlob != null && outputUrl != null;

  return (
    <div className={`ic-row ic-row--${status}`} data-row-id={id}>
      <div className="ic-row-main">
        {/* Name line: name + status chip on the same row so the chip's
            appearance/disappearance never bumps the row's height. */}
        <div className="ic-row-name-row">
          <div className="ic-row-name" title={name}>
            {name}
          </div>
          <span
            className="ic-row-status-chip"
            role="status"
            aria-live="polite"
          >
            {isEncoding && (
              <span className="ic-row-chip ic-row-chip--encoding">
                {status === 'queued' ? 'Queued' : 'Compressing…'}
              </span>
            )}
            {isError && (
              <span className="ic-row-chip ic-row-chip--error">{error}</span>
            )}
          </span>
        </div>

        {/* Meta line: size/savings/dims. Stable height — chip moved to the
            name line above to prevent re-encode jerk. */}
        <div className="ic-row-meta">
          <span className="ic-row-size">{formatBytes(originalSize)}</span>
          {hasOutput && (
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
      </div>

      <div className="ic-row-actions">
        {/* Download button: kept mounted when output exists, disabled during re-encode.
            This prevents position/height jumps in the actions column (Issue 4). */}
        {hasOutput && (
          <Button
            variant="success"
            href={isDone ? outputUrl : undefined}
            download={isDone ? outputName : undefined}
            disabled={isEncoding}
            data-row-id={id}
          >
            {isEncoding ? 'Compressing…' : 'Download'}
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
