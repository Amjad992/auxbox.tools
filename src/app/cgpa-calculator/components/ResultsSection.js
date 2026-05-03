import PropTypes from 'prop-types';
import ResultCard from '../../../components/ResultCard';
import {
  getPerformanceLevel,
  getPerformanceBarWidth,
  formatToDecimalPlaces,
} from '../utils';
import {PERFORMANCE_BAR_LABELS} from '../constants';

export default function ResultsSection({cgpa, totalCredits, semesterCount}) {
  const performanceText = getPerformanceLevel(cgpa, totalCredits);
  const performanceWidth = getPerformanceBarWidth(cgpa);

  return (
    <section className="results-section">
      <div className="tool-results-grid">
        <ResultCard
          label="CGPA"
          value={formatToDecimalPlaces(cgpa)}
          hint="Cumulative Grade Point Average"
        />
        <ResultCard
          label="Total Credits"
          value={totalCredits}
          hint="Total Credit Hours"
        />
        <ResultCard
          label="Semesters"
          value={semesterCount}
          hint="Number of Semesters"
        />
      </div>

      <div className="performance-indicator">
        <h3>Performance Level</h3>
        <div className="performance-bar">
          <div
            className="performance-fill"
            style={{width: `${performanceWidth}%`}}
          ></div>
        </div>
        <div className="performance-labels">
          {PERFORMANCE_BAR_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <p className="performance-text">{performanceText}</p>
      </div>
    </section>
  );
}

ResultsSection.propTypes = {
  cgpa: PropTypes.number.isRequired,
  totalCredits: PropTypes.number.isRequired,
  semesterCount: PropTypes.number.isRequired,
};
