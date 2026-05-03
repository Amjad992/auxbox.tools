import PropTypes from 'prop-types';
import {formatNumber} from '../utils';

export default function ResultsSummary({summary}) {
  if (!summary.beforeSet && !summary.raiseSet) return null;

  return (
    <section className="results-section">
      <div className="results-grid">
        <div className="result-card">
          <h3>Before raise</h3>
          <div className="result-value">${formatNumber(summary.beforeAnnual)}</div>
          <p>per year</p>
        </div>
        <div className="result-card">
          <h3>Raise</h3>
          <div className="result-value">
            {summary.raisePercent !== null
              ? `${formatNumber(summary.raisePercent)}%`
              : '—'}
          </div>
          <p>+${formatNumber(summary.raiseAnnual)} / year</p>
        </div>
        <div className="result-card">
          <h3>After raise</h3>
          <div className="result-value">${formatNumber(summary.afterAnnual)}</div>
          <p>per year</p>
        </div>
      </div>
    </section>
  );
}

ResultsSummary.propTypes = {
  summary: PropTypes.shape({
    beforeAnnual: PropTypes.number,
    raiseAnnual: PropTypes.number,
    raisePercent: PropTypes.number,
    afterAnnual: PropTypes.number,
    beforeSet: PropTypes.bool,
    raiseSet: PropTypes.bool,
  }).isRequired,
};
