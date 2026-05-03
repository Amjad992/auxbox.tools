import PropTypes from 'prop-types';
import Slider from '../../../components/Slider';

const DIM_MIN = 100;

/**
 * Max-width / max-height sliders. Shows original (largest-source) dimensions
 * as a label above each slider. An empty string means "no limit / original".
 *
 * When largestOriginalWidth / largestOriginalHeight are available (> 0), the
 * sliders range from DIM_MIN to that largest source dimension. A "No limit"
 * button resets a dimension to ''.
 *
 * The underlying state (maxWidth / maxHeight) stays as strings so it remains
 * compatible with the existing parseDim / encode pipeline.
 */
export default function DimensionInputs({
  maxWidth,
  maxHeight,
  onMaxWidthChange,
  onMaxHeightChange,
  largestOriginalWidth,
  largestOriginalHeight,
}) {
  const hasOriginals = largestOriginalWidth > 0 && largestOriginalHeight > 0;

  // Slider max is the largest source dimension, or a sensible fallback when
  // no files have been decoded yet.
  const wMax = largestOriginalWidth > DIM_MIN ? largestOriginalWidth : 4096;
  const hMax = largestOriginalHeight > DIM_MIN ? largestOriginalHeight : 4096;

  // Derive numeric slider values from the string state.
  // An empty string (no limit) maps to the slider's max position visually.
  const wVal = maxWidth === '' ? wMax : Math.min(wMax, Math.max(DIM_MIN, Number(maxWidth) || wMax));
  const hVal = maxHeight === '' ? hMax : Math.min(hMax, Math.max(DIM_MIN, Number(maxHeight) || hMax));

  const handleWidth = (v) => {
    // At slider max = "no limit"; otherwise set the numeric value.
    onMaxWidthChange(v >= wMax ? '' : String(v));
  };

  const handleHeight = (v) => {
    onMaxHeightChange(v >= hMax ? '' : String(v));
  };

  return (
    <div className="ic-dims">
      <div className="ic-dim-field">
        {hasOriginals && (
          <span className="ic-label ic-dim-orig">
            Largest source: {largestOriginalWidth} px wide
          </span>
        )}
        <Slider
          id="ic-max-width"
          label="Max width"
          value={wVal}
          min={DIM_MIN}
          max={wMax}
          step={1}
          onChange={handleWidth}
          formatValue={(v) => (v >= wMax ? 'Original' : `${v} px`)}
          leftHint={`${DIM_MIN} px`}
          rightHint="Original"
        />
      </div>
      <div className="ic-dim-field">
        {hasOriginals && (
          <span className="ic-label ic-dim-orig">
            Largest source: {largestOriginalHeight} px tall
          </span>
        )}
        <Slider
          id="ic-max-height"
          label="Max height"
          value={hVal}
          min={DIM_MIN}
          max={hMax}
          step={1}
          onChange={handleHeight}
          formatValue={(v) => (v >= hMax ? 'Original' : `${v} px`)}
          leftHint={`${DIM_MIN} px`}
          rightHint="Original"
        />
      </div>
    </div>
  );
}

DimensionInputs.propTypes = {
  maxWidth: PropTypes.string.isRequired,
  maxHeight: PropTypes.string.isRequired,
  onMaxWidthChange: PropTypes.func.isRequired,
  onMaxHeightChange: PropTypes.func.isRequired,
  largestOriginalWidth: PropTypes.number,
  largestOriginalHeight: PropTypes.number,
};

DimensionInputs.defaultProps = {
  largestOriginalWidth: 0,
  largestOriginalHeight: 0,
};
