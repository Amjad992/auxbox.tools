import PropTypes from 'prop-types';
import Card from '../../../components/Card';
import CurrencyInput from '../../../components/CurrencyInput';

export default function IncomeInputs({rate, currency, onRateChange}) {
  return (
    <Card>
      <h2 className="frc-card-title">Hourly rate</h2>
      <CurrencyInput
        id="frc-income-rate"
        label="Hourly rate"
        currency={currency}
        step="0.01"
        min="0"
        value={rate ?? ''}
        onChange={(e) => onRateChange(e.target.value)}
        placeholder="0"
      />
    </Card>
  );
}

IncomeInputs.propTypes = {
  rate: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  currency: PropTypes.string.isRequired,
  onRateChange: PropTypes.func.isRequired,
};
