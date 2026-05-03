import {useCallback, useRef, useState} from 'react';
import PropTypes from 'prop-types';

/**
 * Click / keyboard / drag-and-drop file picker.
 *
 * Used by image-compressor today; PDF-merger and other future tools that
 * accept files will reuse it. Visual styles live in `tools.css` under
 * `.tool-dropzone*`.
 *
 * Props:
 *   - onFiles    (FileList) => void; called with the selected/dropped files
 *   - accept     standard <input accept="..."> attribute (e.g. "image/*")
 *   - multiple   default true; pass false for a single-file picker
 *   - label      visible primary text
 *   - hint       optional secondary helper text
 *   - disabled
 */
export default function DropZone({
  onFiles,
  accept,
  multiple = true,
  label,
  hint,
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const openPicker = useCallback(() => {
    if (disabled) return;
    inputRef.current?.click();
  }, [disabled]);

  const handleChange = useCallback(
    (e) => {
      const files = e.target.files;
      if (files && files.length > 0) onFiles(files);
      // Reset so the same file can be selected again later.
      e.target.value = '';
    },
    [onFiles]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled) return;
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) onFiles(files);
    },
    [onFiles, disabled]
  );

  const handleDragOver = useCallback(
    (e) => {
      e.preventDefault();
      if (!disabled) setDragOver(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openPicker();
      }
    },
    [openPicker]
  );

  // MIN-3: give the hint a stable id so aria-describedby can reference it.
  // MIN-5: the icon is now an inline SVG (no emoji / system font dependency).
  const hintId = hint ? 'dropzone-hint' : undefined;

  return (
    <div
      className={[
        'tool-dropzone',
        dragOver && 'tool-dropzone--over',
        disabled && 'tool-dropzone--disabled',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={openPicker}
      onKeyDown={handleKeyDown}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-describedby={hintId}
      aria-disabled={disabled || undefined}
    >
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        disabled={disabled}
        onChange={handleChange}
        onClick={(e) => e.stopPropagation()}
        className="tool-dropzone-input"
        tabIndex={-1}
        aria-hidden="true"
      />
      {/* MIN-5: inline SVG upload arrow — no emoji / system font dependency */}
      <div className="tool-dropzone-icon" aria-hidden="true">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="32"
          height="32"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
      </div>
      <p className="tool-dropzone-label">{label}</p>
      {hint && (
        <p id={hintId} className="tool-dropzone-hint">
          {hint}
        </p>
      )}
      {/* MIN-3: live region announces drag-over state to screen readers */}
      <div role="status" aria-live="polite" className="tool-dropzone-sr-status">
        {dragOver ? 'Ready to drop' : ''}
      </div>
    </div>
  );
}

DropZone.propTypes = {
  onFiles: PropTypes.func.isRequired,
  accept: PropTypes.string,
  multiple: PropTypes.bool,
  label: PropTypes.string.isRequired,
  hint: PropTypes.string,
  disabled: PropTypes.bool,
};
