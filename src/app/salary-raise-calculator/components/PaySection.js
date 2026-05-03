import PropTypes from 'prop-types';
import {PERIODS} from '../constants';

const PERIOD_LABELS = {
  hourly: 'Hourly',
  weekly: 'Weekly',
  monthly: 'Monthly',
  annual: 'Annual',
};

/**
 * Renders a card with one input per pay period. Optionally renders a
 * leading "Percentage" input (used by the raise section).
 *
 * All inputs are bidirectional — typing in any one updates the parent's
 * canonical state, which feeds derived values back into the others.
 */
export default function PaySection({
  title,
  group,
  values,
  onChange,
  showPercent,
  percentValue,
}) {
  const handle = (field) => (e) => onChange(group, field, e.target.value);

  return (
    <section className="pay-section">
      <h2 className="pay-section-title">{title}</h2>

      {showPercent && (
        <div className="pay-row">
          <label className="pay-label">Percentage</label>
          <div className="pay-input-wrap">
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              className="pay-input"
              value={percentValue ?? ''}
              onChange={handle('percent')}
              placeholder="0"
            />
            <span className="pay-suffix">%</span>
          </div>
        </div>
      )}

      {PERIODS.map((p) => (
        <div className="pay-row" key={p}>
          <label className="pay-label">{PERIOD_LABELS[p]}</label>
          <div className="pay-input-wrap">
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              className="pay-input"
              value={values[p] ?? ''}
              onChange={handle(p)}
              placeholder="0"
            />
          </div>
        </div>
      ))}
    </section>
  );
}

PaySection.propTypes = {
  title: PropTypes.string.isRequired,
  group: PropTypes.oneOf(['before', 'raise', 'after']).isRequired,
  values: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  showPercent: PropTypes.bool,
  percentValue: PropTypes.string,
};
