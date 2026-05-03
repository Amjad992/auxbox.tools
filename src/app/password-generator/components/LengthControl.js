import PropTypes from 'prop-types';
import {MIN_LENGTH, MAX_LENGTH} from '../constants';

/**
 * Length slider + numeric readout. Tool-local for now.
 * Coordinator candidate: a generic <Slider> in src/components/.
 */
export default function LengthControl({value, onChange}) {
  const handle = (e) => {
    const num = Number(e.target.value);
    if (Number.isInteger(num) && num >= MIN_LENGTH && num <= MAX_LENGTH) {
      onChange(num);
    }
  };

  return (
    <div className="pw-length">
      <div className="pw-length-row">
        <label htmlFor="pw-length-input" className="pw-label">
          Length
        </label>
        <span className="pw-length-value" aria-live="polite">
          {value}
        </span>
      </div>
      <input
        id="pw-length-input"
        type="range"
        min={MIN_LENGTH}
        max={MAX_LENGTH}
        value={value}
        onChange={handle}
        className="pw-slider"
        aria-valuemin={MIN_LENGTH}
        aria-valuemax={MAX_LENGTH}
        aria-valuenow={value}
      />
      <div className="pw-length-hint">
        <span>{MIN_LENGTH}</span>
        <span>{MAX_LENGTH}</span>
      </div>
    </div>
  );
}

LengthControl.propTypes = {
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};
