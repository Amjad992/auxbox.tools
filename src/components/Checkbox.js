import PropTypes from 'prop-types';
import {useId} from 'react';

/**
 * Accessible, custom-styled checkbox primitive.
 *
 * Uses a real <input type="checkbox"> for accessibility (screen readers,
 * keyboard navigation) with the native input visually hidden. A custom div
 * renders the styled box + checkmark. Focus-visible ring appears on the box.
 *
 * Props:
 *   id          — overrides the generated id
 *   label       — ReactNode rendered next to the box (required for a11y)
 *   description — optional secondary text rendered below the label
 *   checked     — controlled checked state
 *   onChange    — called with (boolean) when checked state changes
 *   disabled    — blocks interaction; dims the control
 *   name        — forwarded to the native input
 *   value       — forwarded to the native input
 *   className   — extra class on the outer <label> element
 */
export default function Checkbox({
  id,
  label,
  description,
  checked = false,
  onChange,
  disabled = false,
  name,
  value,
  className,
}) {
  const reactId = useId();
  const inputId = id || `checkbox-${reactId}`;
  const descId = description ? `${inputId}-desc` : undefined;

  const handleChange = (e) => {
    if (!disabled && onChange) onChange(e.target.checked);
  };

  const outerClass = [
    'tool-checkbox',
    disabled ? 'tool-checkbox--disabled' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <label htmlFor={inputId} className={outerClass}>
      <input
        id={inputId}
        type="checkbox"
        className="tool-checkbox-input"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        name={name}
        value={value}
        aria-describedby={descId}
      />
      <span className={`tool-checkbox-box${checked ? ' tool-checkbox-box--checked' : ''}`} aria-hidden="true">
        {checked && (
          <svg
            className="tool-checkbox-check"
            viewBox="0 0 12 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <polyline
              points="1.5,5 4.5,8 10.5,1.5"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className="tool-checkbox-label-group">
        <span className="tool-checkbox-label">{label}</span>
        {description && (
          <span id={descId} className="tool-checkbox-description">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}

Checkbox.propTypes = {
  id: PropTypes.string,
  label: PropTypes.node.isRequired,
  description: PropTypes.node,
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  name: PropTypes.string,
  value: PropTypes.string,
  className: PropTypes.string,
};
