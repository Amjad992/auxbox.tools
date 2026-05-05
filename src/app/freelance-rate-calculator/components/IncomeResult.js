import PropTypes from 'prop-types';
import Card from '../../../components/Card';
import ResultCard from '../../../components/ResultCard';
import {formatCurrency} from '../../../lib/format';

export default function IncomeResult({result, currency, hasRate}) {
  if (!hasRate) {
    return (
      <Card>
        <h2 className="frc-card-title">Projection</h2>
        <p className="frc-income-empty">
          Enter an hourly rate to project your income across every horizon.
        </p>
      </Card>
    );
  }

  const fmt = (n) => formatCurrency(Math.round(n), currency);
  const showBreakdown =
    result.costsAnnual > 0 ||
    result.breakdown.platform > 0 ||
    result.breakdown.processor > 0 ||
    result.breakdown.income > 0 ||
    result.breakdown.other > 0;

  return (
    <Card>
      <h2 className="frc-card-title">Projection</h2>

      <p className="frc-income-row-label">Before fees &amp; taxes</p>
      <div className="tool-results-grid">
        <ResultCard label="Hourly" value={fmt(result.hourly.gross)} />
        <ResultCard label="Daily" value={fmt(result.daily.gross)} />
        <ResultCard label="Weekly" value={fmt(result.weekly.gross)} />
        <ResultCard label="Monthly" value={fmt(result.monthly.gross)} />
        <ResultCard label="Annual" value={fmt(result.annual.gross)} />
      </div>

      <p className="frc-income-row-label">Take-home (after fees, taxes, costs)</p>
      <div className="tool-results-grid">
        <ResultCard label="Hourly" value={fmt(result.hourly.net)} />
        <ResultCard label="Daily" value={fmt(result.daily.net)} />
        <ResultCard label="Weekly" value={fmt(result.weekly.net)} />
        <ResultCard label="Monthly" value={fmt(result.monthly.net)} />
        <ResultCard label="Annual" value={fmt(result.annual.net)} />
      </div>

      {showBreakdown && (
        <>
          <p className="frc-income-row-label">Annual breakdown</p>
          <table className="frc-income-breakdown-table">
            <caption className="tool-sr-only">
              Where your gross income goes annually.
            </caption>
            <thead>
              <tr>
                <th scope="col">Line</th>
                <th scope="col">Amount</th>
              </tr>
            </thead>
            <tbody>
              {result.costsAnnual > 0 && (
                <tr>
                  <td>Operating costs</td>
                  <td>{fmt(result.costsAnnual)}</td>
                </tr>
              )}
              {result.breakdown.platform > 0 && (
                <tr>
                  <td>Platform fees</td>
                  <td>{fmt(result.breakdown.platform)}</td>
                </tr>
              )}
              {result.breakdown.processor > 0 && (
                <tr>
                  <td>Processor fees</td>
                  <td>{fmt(result.breakdown.processor)}</td>
                </tr>
              )}
              {result.breakdown.other > 0 && (
                <tr>
                  <td>Other fees</td>
                  <td>{fmt(result.breakdown.other)}</td>
                </tr>
              )}
              {result.breakdown.income > 0 && (
                <tr>
                  <td>Income tax</td>
                  <td>{fmt(result.breakdown.income)}</td>
                </tr>
              )}
              <tr>
                <td>
                  <strong>Take-home</strong>
                </td>
                <td>
                  <strong>{fmt(result.annual.net)}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      <div className="frc-time-summary" style={{marginTop: '1rem'}}>
        <span className="frc-time-chip">
          Total billable hours: {Math.round(result.totalBillableHours).toLocaleString()}
        </span>
        <span className="frc-time-chip">
          Effective hourly take-home: {fmt(result.hourly.net)}
        </span>
      </div>
    </Card>
  );
}

IncomeResult.propTypes = {
  result: PropTypes.object.isRequired,
  currency: PropTypes.string.isRequired,
  hasRate: PropTypes.bool.isRequired,
};
