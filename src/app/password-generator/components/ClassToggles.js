import PropTypes from 'prop-types';

const TOGGLES = [
  {key: 'upper', label: 'Uppercase (A–Z)'},
  {key: 'lower', label: 'Lowercase (a–z)'},
  {key: 'digits', label: 'Digits (0–9)'},
  {key: 'symbols', label: 'Symbols (!@#…)'},
  {key: 'excludeAmbiguous', label: 'Exclude ambiguous (0/O, 1/l/I)'},
];

/**
 * Character-class toggles + the ambiguous-exclusion toggle. Tool-local.
 * Coordinator candidate: a generic <Toggle> in src/components/.
 */
export default function ClassToggles({settings, onToggle}) {
  return (
    <fieldset className="pw-toggles">
      <legend className="pw-label">Character set</legend>
      <div className="pw-toggle-grid">
        {TOGGLES.map(({key, label}) => (
          <label key={key} className="pw-toggle">
            <input
              type="checkbox"
              checked={!!settings[key]}
              onChange={(e) => onToggle(key, e.target.checked)}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

ClassToggles.propTypes = {
  settings: PropTypes.shape({
    upper: PropTypes.bool.isRequired,
    lower: PropTypes.bool.isRequired,
    digits: PropTypes.bool.isRequired,
    symbols: PropTypes.bool.isRequired,
    excludeAmbiguous: PropTypes.bool.isRequired,
  }).isRequired,
  onToggle: PropTypes.func.isRequired,
};
