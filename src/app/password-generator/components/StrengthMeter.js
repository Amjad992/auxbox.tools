import PropTypes from 'prop-types';

const MAX_BITS_SCALE = 128; // bits at which the bar is fully filled

/**
 * Visual strength bar + label + bit count. Tool-local.
 */
export default function StrengthMeter({bits, strength, poolSize}) {
  const pct = Math.min(100, Math.max(0, (bits / MAX_BITS_SCALE) * 100));
  return (
    <div className="pw-strength">
      <div className="pw-strength-row">
        <span className="pw-label">Strength</span>
        <span className={`pw-strength-label ${strength.className}`}>
          {strength.label}
        </span>
      </div>
      <div
        className="pw-strength-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={MAX_BITS_SCALE}
        aria-valuenow={Math.round(bits)}
        aria-label="Password strength"
      >
        <div
          className={`pw-strength-fill ${strength.className}`}
          style={{width: `${pct}%`}}
        />
      </div>
      <p className="pw-strength-hint">
        {bits > 0
          ? `${bits.toFixed(1)} bits of entropy from a ${poolSize}-character pool`
          : 'Select at least one character class.'}
      </p>
    </div>
  );
}

StrengthMeter.propTypes = {
  bits: PropTypes.number.isRequired,
  strength: PropTypes.shape({
    label: PropTypes.string.isRequired,
    className: PropTypes.string.isRequired,
  }).isRequired,
  poolSize: PropTypes.number.isRequired,
};
