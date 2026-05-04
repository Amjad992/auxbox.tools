import PropTypes from 'prop-types';
import {PRESENTATIONS, SESSION_MODES} from '../constants';

/**
 * Generic segmented control used for both axes — presentation (Quick Pick /
 * Spin Wheel) and session (Single pick / Pick multiple). Implemented as a
 * radiogroup so screen readers announce the choice.
 */
export default function ModeToggle({
  ariaLabel,
  options,
  value,
  onChange,
  disabled,
}) {
  return (
    <div className="ws-mode-toggle" role="radiogroup" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          className={`ws-mode-option${value === opt.value ? ' ws-mode-option--active' : ''}`}
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

export const PRESENTATION_OPTIONS = [
  {value: PRESENTATIONS.QUICK, label: 'Quick Pick'},
  {value: PRESENTATIONS.WHEEL, label: 'Spin Wheel'},
];

export const SESSION_OPTIONS = [
  {value: SESSION_MODES.SINGLE, label: 'Single pick'},
  {value: SESSION_MODES.MULTIPLE, label: 'Pick multiple'},
];
