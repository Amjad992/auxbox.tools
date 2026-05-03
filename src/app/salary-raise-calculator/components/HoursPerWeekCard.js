import PropTypes from 'prop-types';
import Card from '../../../components/Card';

export default function HoursPerWeekCard({value, onChange}) {
  return (
    <Card>
      <h2 className="pay-section-title">Hours per week</h2>
      <div className="pay-row">
        <div className="pay-input-wrap">
          <input
            type="number"
            inputMode="numeric"
            min="0"
            step="0.5"
            className="pay-input"
            value={value ?? ''}
            onChange={(e) => onChange('hpw', null, e.target.value)}
            placeholder="40"
          />
        </div>
      </div>
    </Card>
  );
}

HoursPerWeekCard.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};
