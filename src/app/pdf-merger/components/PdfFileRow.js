import PropTypes from 'prop-types';
import Button from '../../../components/Button';
import {formatBytes} from '../../../lib/format';

/**
 * Reorderable PDF row. Tool-local because the shape (page count, page-range
 * input, drag handle, up/down nudge) doesn't overlap with image-compressor's
 * FileRow. If a third "drop files in" tool needs the same shape, lift the
 * shared visual primitives to `tools.css` then.
 */
export default function PdfFileRow({
  item,
  index,
  total,
  rangeError,
  onRemove,
  onMoveUp,
  onMoveDown,
  onPageRangeChange,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
}) {
  const {id, name, size, pageCount, pageRange, status, errorMessage} = item;

  const isReady = status === 'ready';
  const isParsing = status === 'parsing';
  const isError = status === 'error';

  return (
    <div
      className={[
        'pm-row',
        `pm-row--${status}`,
        isDragging && 'pm-row--dragging',
      ]
        .filter(Boolean)
        .join(' ')}
      data-row-id={id}
      draggable={isReady}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <span
        className="pm-row-handle"
        aria-hidden="true"
        title="Drag to reorder"
      >
        ⠿
      </span>

      <div className="pm-row-main">
        <div className="pm-row-name" title={name}>
          {name}
        </div>
        <div className="pm-row-meta">
          <span className="pm-row-size">{formatBytes(size)}</span>
          <span className="pm-row-dot" aria-hidden="true">
            ·
          </span>
          {isParsing && (
            <span className="pm-row-status pm-row-status--parsing">
              Parsing…
            </span>
          )}
          {isReady && (
            <span className="pm-row-status">
              {`${pageCount} page${pageCount === 1 ? '' : 's'}`}
            </span>
          )}
          {isError && (
            <span className="pm-row-status pm-row-status--error" role="alert">
              {errorMessage}
            </span>
          )}
        </div>

        {isReady && (
          <div className="pm-row-range">
            <label
              htmlFor={`pm-range-${id}`}
              className="pm-row-range-label"
            >
              Pages
            </label>
            <input
              id={`pm-range-${id}`}
              type="text"
              className={[
                'pm-row-range-input',
                rangeError && 'pm-row-range-input--error',
              ]
                .filter(Boolean)
                .join(' ')}
              placeholder="all"
              value={pageRange}
              onChange={(e) => onPageRangeChange(id, e.target.value)}
              aria-invalid={rangeError ? 'true' : undefined}
              aria-describedby={rangeError ? `pm-range-err-${id}` : undefined}
            />
            {rangeError && (
              <span
                id={`pm-range-err-${id}`}
                className="pm-row-range-error"
                role="alert"
              >
                {rangeError}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="pm-row-actions">
        <button
          type="button"
          className="pm-row-nudge"
          onClick={() => onMoveUp(index)}
          disabled={index === 0}
          aria-label={`Move ${name} up`}
        >
          ↑
        </button>
        <button
          type="button"
          className="pm-row-nudge"
          onClick={() => onMoveDown(index)}
          disabled={index === total - 1}
          aria-label={`Move ${name} down`}
        >
          ↓
        </button>
        <Button variant="neutral" onClick={() => onRemove(id)}>
          Remove
        </Button>
      </div>
    </div>
  );
}

PdfFileRow.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    size: PropTypes.number.isRequired,
    pageCount: PropTypes.number,
    pageRange: PropTypes.string.isRequired,
    status: PropTypes.oneOf(['parsing', 'ready', 'error']).isRequired,
    errorMessage: PropTypes.string,
  }).isRequired,
  index: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  rangeError: PropTypes.string,
  onRemove: PropTypes.func.isRequired,
  onMoveUp: PropTypes.func.isRequired,
  onMoveDown: PropTypes.func.isRequired,
  onPageRangeChange: PropTypes.func.isRequired,
  onDragStart: PropTypes.func,
  onDragOver: PropTypes.func,
  onDrop: PropTypes.func,
  onDragEnd: PropTypes.func,
  isDragging: PropTypes.bool,
};
