import PropTypes from 'prop-types';
import Card from '../../../components/Card';
import {formatCurrency} from '../../../lib/format';
import {billableHoursPerYear, requiredRateForTakeHome} from '../utils';

const SENSITIVITY_UTIL = [50, 60, 70, 80, 90, 100];

export default function RateResult({
  result,
  currency,
  hasTarget,
  time,
  costs,
  fees,
  profitMargin,
  people,
  utilizationCurrent,
}) {
  if (!hasTarget) {
    return (
      <Card>
        <h2 className="frc-card-title">Required rate</h2>
        <p className="frc-income-empty">
          Enter a target annual take-home to back-solve your hourly rate.
        </p>
      </Card>
    );
  }

  const fmt = (n) => formatCurrency(Math.round(n), currency);
  const rateLabel =
    Number.isFinite(result.rate) && result.rate > 0
      ? formatCurrency(result.rate, currency, {alwaysDecimals: true})
      : '—';

  const yearlyHours = result.breakdown?.totalBillableHours ?? 0;
  const dailyEquiv = (result.rate * (time.hoursPerDay || 0)) || 0;
  const weeklyEquiv = dailyEquiv * (time.daysPerWeek || 0);
  const monthlyBillableHrs = yearlyHours > 0 ? yearlyHours / 12 : 0;

  // Sensitivity table — recompute the required rate at varying utilization,
  // holding everything else (time, costs, fees, profit, people) fixed.
  const sensitivity = SENSITIVITY_UTIL.map((u) => {
    const bh = billableHoursPerYear({...time, utilization: u});
    const r = requiredRateForTakeHome({
      targetIncome: result.breakdown?.target ?? 0,
      billableHours: bh,
      costs,
      fees,
      profitMargin,
      people,
    });
    return {
      utilization: u,
      rate: r.rate,
      daily: r.rate * (time.hoursPerDay || 0),
      weekly: r.rate * (time.hoursPerDay || 0) * (time.daysPerWeek || 0),
      annualBillable: bh * (people || 1),
    };
  });

  return (
    <Card>
      <h2 className="frc-card-title">Required rate</h2>
      <div className="frc-rate-display" aria-live="polite">
        <p className="frc-rate-display-label">Required hourly rate</p>
        <p className="frc-rate-display-value">{rateLabel}</p>
        {Number.isFinite(result.rate) && (
          <p className="frc-rate-display-equiv">
            Daily: {fmt(dailyEquiv)} · Weekly: {fmt(weeklyEquiv)} · Monthly
            billable hrs: {Math.round(monthlyBillableHrs)}
          </p>
        )}
      </div>

      <p className="frc-sensitivity-caption">
        How brittle is this answer to your utilization assumption?
      </p>
      <table className="frc-sensitivity-table">
        <caption className="tool-sr-only">
          Required hourly rate at varying utilization, keeping every other
          assumption constant.
        </caption>
        <thead>
          <tr>
            <th scope="col">Utilization</th>
            <th scope="col">Required rate</th>
            <th scope="col">Daily</th>
            <th scope="col">Weekly</th>
          </tr>
        </thead>
        <tbody>
          {sensitivity.map((row) => {
            const isCurrent = row.utilization === utilizationCurrent;
            return (
              <tr
                key={row.utilization}
                className={isCurrent ? 'frc-sensitivity-current' : undefined}
              >
                <td>
                  {row.utilization}%{isCurrent ? ' (yours)' : ''}
                </td>
                <td>
                  {Number.isFinite(row.rate)
                    ? formatCurrency(row.rate, currency, {alwaysDecimals: true})
                    : '—'}
                </td>
                <td>{Number.isFinite(row.daily) ? fmt(row.daily) : '—'}</td>
                <td>{Number.isFinite(row.weekly) ? fmt(row.weekly) : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

RateResult.propTypes = {
  result: PropTypes.object.isRequired,
  currency: PropTypes.string.isRequired,
  hasTarget: PropTypes.bool.isRequired,
  time: PropTypes.object.isRequired,
  costs: PropTypes.number.isRequired,
  fees: PropTypes.object.isRequired,
  profitMargin: PropTypes.number.isRequired,
  people: PropTypes.number.isRequired,
  utilizationCurrent: PropTypes.number.isRequired,
};
