import PropTypes from 'prop-types';
import Card from '../../../components/Card';
import Slider from '../../../components/Slider';

const PLATFORM_PRESETS = [
  {label: 'Direct (0%)', value: 0},
  {label: 'Upwork (10%)', value: 10},
  {label: 'Fiverr (20%)', value: 20},
];
const PROCESSOR_PRESETS = [
  {label: 'None (0%)', value: 0},
  {label: 'Stripe (2.9%)', value: 2.9},
  {label: 'PayPal (3.4%)', value: 3.4},
];

export default function FeesCard({value, onChange}) {
  const set = (field) => (v) => onChange({...value, [field]: v});

  return (
    <Card>
      <div className="frc-card-header">
        <h2 className="frc-card-title">Fees &amp; taxes</h2>
        <p className="frc-card-hint">
          Compound chain — each fee is taken on what remains after the
          previous one: <code>net = gross × (1−platform) × (1−processor) ×
          (1−other) × (1−tax)</code>.
        </p>
      </div>

      <div className="frc-fees-stack">
        <div>
          <Slider
            id="frc-platform-fee"
            label="Platform fee"
            value={value.platformFee}
            min={0}
            max={30}
            step={0.1}
            onChange={set('platformFee')}
            integerOnly={false}
            formatValue={(v) => `${v}%`}
            rightHint="30%"
            leftHint="0%"
          />
          <PresetRow
            presets={PLATFORM_PRESETS}
            current={value.platformFee}
            onPick={set('platformFee')}
          />
        </div>

        <div>
          <Slider
            id="frc-processor-fee"
            label="Payment processor fee"
            value={value.processorFee}
            min={0}
            max={10}
            step={0.1}
            onChange={set('processorFee')}
            integerOnly={false}
            formatValue={(v) => `${v}%`}
            rightHint="10%"
            leftHint="0%"
          />
          <PresetRow
            presets={PROCESSOR_PRESETS}
            current={value.processorFee}
            onPick={set('processorFee')}
          />
        </div>

        <Slider
          id="frc-income-tax"
          label="Income tax"
          value={value.incomeTax}
          min={0}
          max={60}
          step={0.5}
          onChange={set('incomeTax')}
          integerOnly={false}
          formatValue={(v) => `${v}%`}
          rightHint="60%"
          leftHint="0%"
        />

        <Slider
          id="frc-other-fee"
          label="Other fees"
          value={value.otherFee}
          min={0}
          max={30}
          step={0.1}
          onChange={set('otherFee')}
          integerOnly={false}
          formatValue={(v) => `${v}%`}
          rightHint="30%"
          leftHint="0%"
        />
      </div>
    </Card>
  );
}

function PresetRow({presets, current, onPick}) {
  return (
    <div className="frc-presets">
      {presets.map((p) => {
        const active = Math.abs(p.value - current) < 0.001;
        return (
          <button
            type="button"
            key={p.label}
            className={`frc-preset${active ? ' frc-preset--active' : ''}`}
            onClick={() => onPick(p.value)}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

PresetRow.propTypes = {
  presets: PropTypes.array.isRequired,
  current: PropTypes.number.isRequired,
  onPick: PropTypes.func.isRequired,
};

FeesCard.propTypes = {
  value: PropTypes.shape({
    platformFee: PropTypes.number.isRequired,
    processorFee: PropTypes.number.isRequired,
    incomeTax: PropTypes.number.isRequired,
    otherFee: PropTypes.number.isRequired,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};
