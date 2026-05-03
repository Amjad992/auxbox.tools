import PropTypes from 'prop-types';
import Slider from '../../../components/Slider';
import {MAX_QUALITY, MIN_QUALITY, QUALITY_STEP} from '../constants';

/**
 * Quality slider for the image-compressor (0.1–1.0). Thin wrapper around
 * the shared <Slider> primitive — it just provides image-compressor-specific
 * bounds, label, and a percentage-style readout/hints.
 */
export default function QualityControl({value, onChange, disabled}) {
  return (
    <Slider
      id="ic-quality-input"
      label="Quality"
      value={value}
      min={MIN_QUALITY}
      max={MAX_QUALITY}
      step={QUALITY_STEP}
      onChange={onChange}
      disabled={disabled}
      formatValue={(v) => `${Math.round(v * 100)}%`}
      leftHint="Smaller file"
      rightHint="Better quality"
    />
  );
}

QualityControl.propTypes = {
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
