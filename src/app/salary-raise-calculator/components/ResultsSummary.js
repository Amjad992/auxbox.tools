import PropTypes from 'prop-types';
import ResultCard from '../../../components/ResultCard';
import {formatNumber} from '../utils';

export default function ResultsSummary({summary}) {
  if (!summary.beforeSet && !summary.raiseSet) return null;

  return (
    <section className="results-section">
      <div className="tool-results-grid">
        <ResultCard
          label="Before raise"
          value={`$${formatNumber(summary.beforeAnnual)}`}
          hint="per year"
        />
        <ResultCard
          label="Raise"
          value={
            summary.raisePercent !== null
              ? `${formatNumber(summary.raisePercent)}%`
              : '—'
          }
          hint={`+$${formatNumber(summary.raiseAnnual)} / year`}
        />
        <ResultCard
          label="After raise"
          value={`$${formatNumber(summary.afterAnnual)}`}
          hint="per year"
        />
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
}
