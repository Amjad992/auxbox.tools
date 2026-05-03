import PropTypes from 'prop-types';

/**
 * Generic labelled range slider with a numeric readout, optional hints,
 * filled progress track, and an optional precision numeric input.
 *
 * Used by the password-generator (length) and image-compressor (quality,
 * dimension sliders).
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
 *   - withNumericInput     show a number <input> beside the track for
 *                          keyboard-precise entry (opt-in; does not affect
 *                          existing consumers that omit the prop)
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
  withNumericInput = false,
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

  const handleNumeric = (e) => {
    const raw = e.target.value;
    if (raw === '') return;
    const num = Number(raw);
    if (!Number.isFinite(num)) return;
    const clamped = Math.min(max, Math.max(min, num));
    const final = isInteger ? Math.round(clamped) : clamped;
    onChange(final);
  };

  const readout = formatValue ? formatValue(value) : value;
  const left = leftHint !== undefined ? leftHint : min;
  const right = rightHint !== undefined ? rightHint : max;

  // Compute fill percentage for the filled-track gradient (CSS custom property).
  const fillPct = max > min ? ((value - min) / (max - min)) * 100 : 0;

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
      <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
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
          style={{'--fill': `${fillPct}%`}}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
        />
        {withNumericInput && (
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleNumeric}
            disabled={disabled}
            className="tool-slider-numeric"
            aria-label={`${typeof label === 'string' ? label : ''} value`}
          />
        )}
      </div>
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
  withNumericInput: PropTypes.bool,
  disabled: PropTypes.bool,
};
