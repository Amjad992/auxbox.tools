import PropTypes from 'prop-types';

/**
 * Generic labelled range slider with a numeric readout and optional hints.
 * Used by the password-generator (length) and image-compressor (quality).
 *
 * Visual styles live in `src/styles/tools.css` under `.tool-slider*`.
 *
 * Props:
 *   - id              required; ties label to input
 *   - label           visible label text
 *   - value           current value
 *   - min, max        range bounds
 *   - step            increment (defaults to 1 — integer slider)
 *   - onChange        called with the new numeric value
 *   - integerOnly     when true, fractional inputs are dropped (defaults to
 *                     true when step is omitted/1; false when a fractional
 *                     step is supplied)
 *   - formatValue     (value) => string for the readout next to the label
 *   - leftHint, rightHint  end-of-track hints; default to min/max
 *   - disabled
 */
export default function Slider({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  integerOnly,
  formatValue,
  leftHint,
  rightHint,
  disabled,
}) {
  const isInteger =
    integerOnly !== undefined ? integerOnly : Number.isInteger(step);

  const handle = (e) => {
    const num = Number(e.target.value);
    if (!Number.isFinite(num)) return;
    if (num < min || num > max) return;
    if (isInteger && !Number.isInteger(num)) return;
    onChange(num);
  };

  const readout = formatValue ? formatValue(value) : value;
  const left = leftHint !== undefined ? leftHint : min;
  const right = rightHint !== undefined ? rightHint : max;

  return (
    <div className="tool-slider">
      <div className="tool-slider-row">
        <label htmlFor={id} className="tool-slider-label">
          {label}
        </label>
        <span className="tool-slider-value" aria-live="polite">
          {readout}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handle}
        disabled={disabled}
        className="tool-slider-input"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />
      <div className="tool-slider-hint">
        <span>{left}</span>
        <span>{right}</span>
      </div>
    </div>
  );
}

Slider.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.node.isRequired,
  value: PropTypes.number.isRequired,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  step: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  integerOnly: PropTypes.bool,
  formatValue: PropTypes.func,
  leftHint: PropTypes.node,
  rightHint: PropTypes.node,
  disabled: PropTypes.bool,
};
