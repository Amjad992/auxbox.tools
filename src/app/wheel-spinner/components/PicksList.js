import PropTypes from 'prop-types';

/**
 * Numbered "Picks so far" panel for the Pick-multiple session mode.
 * Renders nothing when empty (parent decides whether to show the section).
 */
export default function PicksList({picks}) {
  if (!picks || picks.length === 0) return null;
  return (
    <div className="ws-picks">
      <h3 className="ws-picks-title">Picks so far ({picks.length})</h3>
      <ol className="ws-picks-list">
        {picks.map((p, i) => (
          <li key={`${i}:${p}`} className="ws-picks-item">
            {p}
          </li>
        ))}
      </ol>
    </div>
  );
}

PicksList.propTypes = {
  picks: PropTypes.arrayOf(PropTypes.string).isRequired,
};
