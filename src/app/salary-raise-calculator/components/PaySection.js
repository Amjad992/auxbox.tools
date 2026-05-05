import PropTypes from 'prop-types';
import Card from '../../../components/Card';
import CurrencyInput from '../../../components/CurrencyInput';
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
 * The pay-period inputs use shared `<CurrencyInput>` (lifted in the
 * freelance-rate-calculator branch). The percent input keeps the local
 * pay-input styling because it's not a currency.
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
          <CurrencyInput
            key={p}
            className="pay-row"
            label={PERIOD_LABELS[p]}
            currency="USD"
            value={values[p] ?? ''}
            onChange={handle(p)}
            step="0.01"
            placeholder="0"
          />
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
