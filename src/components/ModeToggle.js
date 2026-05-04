import PropTypes from 'prop-types';

/**
 * Generic segmented control implemented as a radiogroup so screen readers
 * announce the active choice. Visual styling lives in `src/styles/tools.css`
 * under `.mode-toggle` / `.mode-option`.
 *
 * Used by:
 *   - Wheel Spinner (presentation + session axes)
 *   - Markdown to PDF (preset picker)
 */
export default function ModeToggle({
  ariaLabel,
  options,
  value,
  onChange,
  disabled,
}) {
  return (
    <div className="mode-toggle" role="radiogroup" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          className={`mode-option${
            value === opt.value ? ' mode-option--active' : ''
          }`}
          onClick={() => onChange(opt.value)}
          disabled={disabled}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

ModeToggle.propTypes = {
  ariaLabel: PropTypes.string.isRequired,
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
