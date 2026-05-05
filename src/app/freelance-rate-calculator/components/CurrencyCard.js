import PropTypes from 'prop-types';
import Card from '../../../components/Card';
import {CURRENCIES} from '../constants';

export default function CurrencyCard({value, onChange}) {
  return (
    <Card>
      <div className="frc-currency-row">
        <label htmlFor="frc-currency" className="frc-currency-label">
          Currency
        </label>
        <select
          id="frc-currency"
          className="frc-currency-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {CURRENCIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <p className="frc-currency-note">
          Display label only — no FX conversion.
        </p>
      </div>
    </Card>
  );
}

CurrencyCard.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};
