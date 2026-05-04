import PropTypes from 'prop-types';

/**
 * Quick Pick presentation: render the entry list as chips; the chip whose
 * index === highlightIndex is emphasised, others are dimmed when an
 * animation is running.
 *
 * The schedule is driven by the parent hook (single setTimeout chain).
 * This component is presentational only.
 */
export default function QuickPick({
  entries,
  highlightIndex,
  isRunning,
  isDone,
}) {
  return (
    <div
      className={`ws-quickpick${isRunning ? ' ws-quickpick--running' : ''}${isDone ? ' ws-quickpick--done' : ''}`}
    >
      <ul className="ws-quickpick-list">
        {entries.map((entry, i) => {
          const active = i === highlightIndex;
          return (
            <li
              key={`${i}:${entry}`}
              className={`ws-quickpick-chip${active ? ' ws-quickpick-chip--active' : ''}`}
              aria-current={active ? 'true' : undefined}
            >
              {entry}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

QuickPick.propTypes = {
  entries: PropTypes.arrayOf(PropTypes.string).isRequired,
  highlightIndex: PropTypes.number,
  isRunning: PropTypes.bool,
  isDone: PropTypes.bool,
};
