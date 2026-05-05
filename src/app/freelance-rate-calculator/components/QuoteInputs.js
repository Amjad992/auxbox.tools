import PropTypes from 'prop-types';
import Card from '../../../components/Card';
import CurrencyInput from '../../../components/CurrencyInput';
import InputField from '../../../components/InputField';

export default function QuoteInputs({
  hours,
  rate,
  currency,
  onHoursChange,
  onRateChange,
}) {
  return (
    <Card>
      <h2 className="frc-card-title">Job details</h2>
      <div className="frc-quote-inputs">
        <InputField
          id="frc-hours"
          label="Hours"
          type="number"
          inputMode="decimal"
          step="0.25"
          min="0"
          value={hours ?? ''}
          onChange={(e) => onHoursChange(e.target.value)}
          placeholder="0"
        />
        <CurrencyInput
          id="frc-rate"
          label="Hourly rate"
          currency={currency}
          step="0.01"
          min="0"
          value={rate ?? ''}
          onChange={(e) => onRateChange(e.target.value)}
          placeholder="0"
        />
      </div>
    </Card>
  );
}

QuoteInputs.propTypes = {
  hours: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  rate: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  currency: PropTypes.string.isRequired,
  onHoursChange: PropTypes.func.isRequired,
  onRateChange: PropTypes.func.isRequired,
};
