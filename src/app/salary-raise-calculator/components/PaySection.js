import PropTypes from 'prop-types';
import Card from '../../../components/Card';
import {PERIODS} from '../constants';

const PERIOD_LABELS = {
  hourly: 'Hourly',
  weekly: 'Weekly',
  monthly: 'Monthly',
  annual: 'Annual',
};

/**
 * One card with a labeled input per pay period. Optionally includes a
 * leading "Percentage" input (used by the raise section).
 *
 * All inputs are bidirectional — typing in any one calls onChange so the
 * parent's canonical state can recompute the rest.
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
    <Card>
      <h2 className="pay-section-title">{title}</h2>

      <div className="pay-grid">
        {showPercent && (
          <div className="pay-row pay-row--full">
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
      </div>
    </Card>
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
