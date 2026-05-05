import PropTypes from 'prop-types';
import Card from '../../../components/Card';
import Slider from '../../../components/Slider';

export default function TeamCard({value, onChange}) {
  return (
    <Card>
      <div className="frc-card-header">
        <h2 className="frc-card-title">Team</h2>
        <p className="frc-card-hint">
          v1 simplification: every billable person shares the same rate
          and utilization, so total revenue scales linearly.
        </p>
      </div>
      <Slider
        id="frc-team-people"
        label="Number of billable people"
        value={value.people}
        min={1}
        max={50}
        step={1}
        onChange={(v) => onChange({...value, people: v})}
        formatValue={(v) => `${v} ${v === 1 ? 'person' : 'people'}`}
        leftHint="1"
        rightHint="50"
      />
    </Card>
  );
}

TeamCard.propTypes = {
  value: PropTypes.shape({
    people: PropTypes.number.isRequired,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};
