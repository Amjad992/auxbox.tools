import PropTypes from 'prop-types';
import Card from '../../../components/Card';
import CurrencySelect from '../../../components/CurrencySelect';

export default function CurrencyCard({value, onChange}) {
  return (
    <Card>
      <div className="frc-currency-row">
        <CurrencySelect
          id="frc-currency"
          value={value}
          onChange={onChange}
        />
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
