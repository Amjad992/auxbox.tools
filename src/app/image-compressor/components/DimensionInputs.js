import PropTypes from 'prop-types';

/**
 * Optional max-width / max-height inputs. Blank values mean "no limit".
 * Only positive integers are accepted; non-numeric input is ignored on
 * commit (the encode step also defends against bad values).
 */
export default function DimensionInputs({
  maxWidth,
  maxHeight,
  onMaxWidthChange,
  onMaxHeightChange,
}) {
  const handle = (setter) => (e) => {
    const v = e.target.value;
    if (v === '') return setter('');
    if (/^\d+$/.test(v)) setter(v);
  };

  return (
    <div className="ic-dims">
      <label className="ic-dim-field">
        <span className="ic-label">Max width (px)</span>
        <input
          type="text"
          inputMode="numeric"
          value={maxWidth}
          onChange={handle(onMaxWidthChange)}
          placeholder="Original"
          className="ic-input"
        />
      </label>
      <label className="ic-dim-field">
        <span className="ic-label">Max height (px)</span>
        <input
          type="text"
          inputMode="numeric"
          value={maxHeight}
          onChange={handle(onMaxHeightChange)}
          placeholder="Original"
          className="ic-input"
        />
      </label>
    </div>
  );
}

DimensionInputs.propTypes = {
  maxWidth: PropTypes.string.isRequired,
  maxHeight: PropTypes.string.isRequired,
  onMaxWidthChange: PropTypes.func.isRequired,
  onMaxHeightChange: PropTypes.func.isRequired,
};
