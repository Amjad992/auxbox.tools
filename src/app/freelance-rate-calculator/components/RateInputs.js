import PropTypes from 'prop-types';
import Card from '../../../components/Card';
import CurrencyInput from '../../../components/CurrencyInput';

export default function RateInputs({targetIncome, currency, onChange}) {
  return (
    <Card>
      <h2 className="frc-card-title">Target take-home</h2>
      <CurrencyInput
        id="frc-target-income"
        label="Target annual take-home income"
        currency={currency}
        step="100"
        min="0"
        value={targetIncome ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        helper="What you want to keep at the end of the year, after fees, costs, and taxes."
      />
    </Card>
  );
}

RateInputs.propTypes = {
  targetIncome: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  currency: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};
