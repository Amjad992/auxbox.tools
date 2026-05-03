import PropTypes from 'prop-types';
import Slider from '../../../components/Slider';
import {MIN_LENGTH, MAX_LENGTH} from '../constants';

/**
 * Length slider for the password generator. Thin wrapper around the shared
 * <Slider> primitive — keeps the password-generator's existing label, IDs,
 * and bounds while letting the visual / a11y plumbing live in one place.
 */
export default function LengthControl({value, onChange}) {
  return (
    <Slider
      id="pw-length-input"
      label="Length"
      value={value}
      min={MIN_LENGTH}
      max={MAX_LENGTH}
      onChange={onChange}
    />
  );
}

LengthControl.propTypes = {
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};
