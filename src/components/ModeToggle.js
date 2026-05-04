import {useRef} from 'react';
import PropTypes from 'prop-types';

/**
 * Generic segmented control implemented as a radiogroup so screen readers
 * announce the active choice. Visual styling lives in `src/styles/tools.css`
 * under `.mode-toggle` / `.mode-option`.
 *
 * Implements the WAI-ARIA radio keyboard pattern:
 *   - Roving tabindex: the active option has tabIndex=0; others have -1.
 *   - ArrowRight / ArrowDown → next option (wraps).
 *   - ArrowLeft / ArrowUp → previous option (wraps).
 *   - Home → first option; End → last option.
 *   - Space / Enter activate via native <button> click (no extra handler needed).
 *
 * Used by:
 *   - Wheel Spinner (presentation + session axes)
 *   - Markdown to PDF (preset picker)
 */
export default function ModeToggle({
  ariaLabel,
  ariaDescribedBy,
  options,
  value,
  onChange,
  disabled,
}) {
  // One ref per option button so we can move focus after an arrow-key change.
  const buttonRefs = useRef([]);

  const handleKeyDown = (e) => {
    if (disabled) return;

    const currentIndex = options.findIndex((o) => o.value === value);
    const count = options.length;
    let nextIndex = null;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % count;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (currentIndex - 1 + count) % count;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = count - 1;
        break;
      default:
        return; // Don't prevent default for unhandled keys.
    }

    e.preventDefault();
    onChange(options[nextIndex].value);
    // Move focus to the newly-selected radio immediately. The parent will
    // re-render with the new value, but the button element at this index is
    // already in the DOM so focus is stable.
    buttonRefs.current[nextIndex]?.focus();
  };

  return (
    <div
      className="mode-toggle"
      role="radiogroup"
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      onKeyDown={handleKeyDown}
    >
      {options.map((opt, i) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              buttonRefs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={isActive}
            tabIndex={isActive ? 0 : -1}
            className={`mode-option${isActive ? ' mode-option--active' : ''}`}
            onClick={() => onChange(opt.value)}
            disabled={disabled}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

ModeToggle.propTypes = {
  ariaLabel: PropTypes.string.isRequired,
  ariaDescribedBy: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
