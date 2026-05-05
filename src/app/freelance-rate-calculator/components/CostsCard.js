import PropTypes from 'prop-types';
import Card from '../../../components/Card';
import CurrencyInput from '../../../components/CurrencyInput';
import Button from '../../../components/Button';
import {formatCurrency} from '../../../lib/format';
import {
  COSTS_VIEW,
  COST_PERIOD,
  COST_SUGGESTIONS,
} from '../constants';
import {totalAnnualCosts} from '../utils';

let nextId = 0;
const newId = () => `c${Date.now()}-${++nextId}`;

export default function CostsCard({value, currency, onChange}) {
  const setView = (view) => onChange({...value, view});
  const setQuickAmount = (raw) => {
    const n = raw === '' ? null : parseFloat(raw);
    onChange({
      ...value,
      quickAmount: Number.isFinite(n) ? n : null,
    });
  };
  const setQuickPeriod = (quickPeriod) => onChange({...value, quickPeriod});

  const updateLine = (id, patch) => {
    const lineItems = value.lineItems.map((it) =>
      it.id === id ? {...it, ...patch} : it
    );
    onChange({...value, lineItems});
  };
  const addLine = (label = '') => {
    const lineItems = [
      ...value.lineItems,
      {id: newId(), label, amount: null, period: COST_PERIOD.MONTHLY},
    ];
    onChange({...value, lineItems});
  };
  const removeLine = (id) =>
    onChange({...value, lineItems: value.lineItems.filter((it) => it.id !== id)});

  // Derived total used in detailed mode footer.
  const detailedTotal = totalAnnualCosts(value.lineItems);
  const usedSuggestions = new Set(value.lineItems.map((it) => it.label));

  return (
    <Card>
      <div className="frc-card-header">
        <h2 className="frc-card-title">Operating costs</h2>
        <p className="frc-card-hint">
          Costs are amortised across billable hours to set the
          cost-per-hour floor.
        </p>
      </div>

      <div className="frc-costs-toggle" role="tablist" aria-label="Costs entry mode">
        <button
          type="button"
          role="tab"
          aria-selected={value.view === COSTS_VIEW.QUICK}
          className={`frc-costs-toggle-btn${
            value.view === COSTS_VIEW.QUICK ? ' frc-costs-toggle-btn--active' : ''
          }`}
          onClick={() => setView(COSTS_VIEW.QUICK)}
        >
          Quick
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={value.view === COSTS_VIEW.DETAILED}
          className={`frc-costs-toggle-btn${
            value.view === COSTS_VIEW.DETAILED ? ' frc-costs-toggle-btn--active' : ''
          }`}
          onClick={() => setView(COSTS_VIEW.DETAILED)}
        >
          Detailed
        </button>
      </div>

      {value.view === COSTS_VIEW.QUICK ? (
        <div className="frc-costs-quick-row">
          <CurrencyInput
            id="frc-costs-quick"
            label={
              value.quickPeriod === COST_PERIOD.ANNUAL
                ? 'Annual operating costs'
                : 'Monthly operating costs'
            }
            currency={currency}
            value={value.quickAmount ?? ''}
            onChange={(e) => setQuickAmount(e.target.value)}
            step="0.01"
            min="0"
            placeholder="0"
          />
          <select
            aria-label="Period"
            className="frc-costs-period"
            value={value.quickPeriod}
            onChange={(e) => setQuickPeriod(e.target.value)}
          >
            <option value={COST_PERIOD.MONTHLY}>per month</option>
            <option value={COST_PERIOD.ANNUAL}>per year</option>
          </select>
        </div>
      ) : (
        <>
          <div className="frc-costs-line-list">
            {value.lineItems.length === 0 ? (
              <p className="frc-coming-soon">
                No line items yet — pick a suggestion below or add a custom entry.
              </p>
            ) : (
              value.lineItems.map((it) => (
                <CostLine
                  key={it.id}
                  item={it}
                  currency={currency}
                  onChange={(patch) => updateLine(it.id, patch)}
                  onRemove={() => removeLine(it.id)}
                />
              ))
            )}
          </div>

          <div className="frc-costs-line-suggestions">
            {COST_SUGGESTIONS.filter((s) => !usedSuggestions.has(s)).map((s) => (
              <button
                key={s}
                type="button"
                className="frc-preset"
                onClick={() => addLine(s)}
              >
                + {s}
              </button>
            ))}
            <Button variant="neutral" onClick={() => addLine('')}>
              + Custom line
            </Button>
          </div>

          <div className="frc-costs-total">
            <span>Annualised total</span>
            <span className="frc-costs-total-amount">
              {formatCurrency(detailedTotal, currency)}
            </span>
          </div>
        </>
      )}
    </Card>
  );
}

function CostLine({item, currency, onChange, onRemove}) {
  return (
    <div className="frc-costs-line">
      <input
        type="text"
        className="tool-currency-input"
        style={{
          background: '#1f1f1f',
          border: '1px solid var(--border-color)',
          borderRadius: 8,
          padding: '10px 12px',
        }}
        value={item.label}
        placeholder="Label (e.g. Software)"
        onChange={(e) => onChange({label: e.target.value})}
      />
      <CurrencyInput
        id={`frc-cost-${item.id}`}
        label=""
        currency={currency}
        value={item.amount ?? ''}
        onChange={(e) => {
          const n = e.target.value === '' ? null : parseFloat(e.target.value);
          onChange({amount: Number.isFinite(n) ? n : null});
        }}
        step="0.01"
        min="0"
        placeholder="0"
      />
      <select
        className="frc-costs-period"
        value={item.period}
        onChange={(e) => onChange({period: e.target.value})}
        aria-label="Period for this line item"
      >
        <option value={COST_PERIOD.MONTHLY}>/ mo</option>
        <option value={COST_PERIOD.ANNUAL}>/ yr</option>
      </select>
      <Button variant="neutral" onClick={onRemove}>
        Remove
      </Button>
    </div>
  );
}

CostLine.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    amount: PropTypes.number,
    period: PropTypes.string.isRequired,
  }).isRequired,
  currency: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};

CostsCard.propTypes = {
  value: PropTypes.shape({
    view: PropTypes.string.isRequired,
    quickAmount: PropTypes.number,
    quickPeriod: PropTypes.string.isRequired,
    lineItems: PropTypes.array.isRequired,
  }).isRequired,
  currency: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};
