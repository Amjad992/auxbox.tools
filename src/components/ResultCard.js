import PropTypes from 'prop-types';

/**
 * One stat tile in a results grid. Wrap a list of these in
 * <div className="tool-results-grid">...</div>.
 */
export default function ResultCard({label, value, hint}) {
  return (
    <div className="tool-result-card">
      <h3>{label}</h3>
      <div className="tool-result-value">{value}</div>
      {hint && <p>{hint}</p>}
    </div>
  );
}

ResultCard.propTypes = {
  label: PropTypes.node.isRequired,
  value: PropTypes.node.isRequired,
  hint: PropTypes.node,
};
