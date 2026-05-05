import PropTypes from 'prop-types';
import Card from '../../../components/Card';
import Slider from '../../../components/Slider';

export default function ProfitCard({value, onChange}) {
  return (
    <Card>
      <div className="frc-card-header">
        <h2 className="frc-card-title">Profit buffer</h2>
        <p className="frc-card-hint">
          A margin on top of break-even — covers slow months, growth, and
          the gap between &ldquo;I survived&rdquo; and &ldquo;I am building
          something&rdquo;. 10–20% is a sensible starting point.
        </p>
      </div>
      <Slider
        id="frc-profit-margin"
        label="Profit margin"
        value={value}
        min={0}
        max={100}
        step={1}
        onChange={onChange}
        formatValue={(v) => `${v}%`}
        leftHint="0%"
        rightHint="100%"
      />
    </Card>
  );
}

ProfitCard.propTypes = {
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};
