import PropTypes from 'prop-types';
import Card from '../../../components/Card';
import Slider from '../../../components/Slider';
import {billableHoursPerYear, workingHoursPerYear} from '../utils';

export default function TimeCard({value, onChange}) {
  const set = (field) => (v) => onChange({...value, [field]: v});
  const working = workingHoursPerYear(value);
  const billable = billableHoursPerYear(value);

  return (
    <Card>
      <div className="frc-card-header">
        <h2 className="frc-card-title">Time &amp; utilization</h2>
        <p className="frc-card-hint">
          Working time × utilization → billable hours per year. Utilization
          is the gap between hours you can work and hours you actually bill.
        </p>
      </div>

      <div className="frc-time-grid">
        <Slider
          id="frc-hours-per-day"
          label="Hours per working day"
          value={value.hoursPerDay}
          min={1}
          max={16}
          step={1}
          onChange={set('hoursPerDay')}
          formatValue={(v) => `${v} hr`}
        />
        <Slider
          id="frc-days-per-week"
          label="Days per working week"
          value={value.daysPerWeek}
          min={1}
          max={7}
          step={1}
          onChange={set('daysPerWeek')}
          formatValue={(v) => `${v} ${v === 1 ? 'day' : 'days'}`}
        />
        <Slider
          id="frc-weeks-per-year"
          label="Weeks per working year"
          value={value.weeksPerYear}
          min={0}
          max={52}
          step={1}
          onChange={set('weeksPerYear')}
          formatValue={(v) => `${v} wk`}
        />
        <Slider
          id="frc-utilization"
          label="Billable utilization"
          value={value.utilization}
          min={30}
          max={100}
          step={1}
          onChange={set('utilization')}
          formatValue={(v) => `${v}%`}
          leftHint="30%"
          rightHint="100%"
        />
      </div>

      <div className="frc-time-summary" aria-live="polite">
        <span className="frc-time-chip">
          Working: {working.toLocaleString()} hrs/yr
        </span>
        <span className="frc-time-chip">
          Billable: {Math.round(billable).toLocaleString()} hrs/yr
        </span>
      </div>
    </Card>
  );
}

TimeCard.propTypes = {
  value: PropTypes.shape({
    hoursPerDay: PropTypes.number.isRequired,
    daysPerWeek: PropTypes.number.isRequired,
    weeksPerYear: PropTypes.number.isRequired,
    utilization: PropTypes.number.isRequired,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};
