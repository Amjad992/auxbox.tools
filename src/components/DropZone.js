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
      aria-label={label}
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
      <div className="tool-dropzone-icon" aria-hidden="true">
        ⬆
      </div>
      <p className="tool-dropzone-label">{label}</p>
      {hint && <p className="tool-dropzone-hint">{hint}</p>}
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
