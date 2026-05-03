import PropTypes from 'prop-types';

const CLASS_TOGGLES = [
  {key: 'upper', label: 'Uppercase (A–Z)'},
  {key: 'lower', label: 'Lowercase (a–z)'},
  {key: 'digits', label: 'Digits (0–9)'},
  {key: 'symbols', label: 'Symbols (!@#…)'},
];

const EXTRA_TOGGLES = [{key: 'excludeAmbiguous', label: 'Exclude ambiguous (0/O, 1/l/I)'}];

const TOGGLES = [...CLASS_TOGGLES, ...EXTRA_TOGGLES];

const CLASS_KEYS = CLASS_TOGGLES.map((t) => t.key);

/**
 * Character-class toggles + the ambiguous-exclusion toggle. Tool-local.
 * Coordinator candidate: a generic <Toggle> in src/components/.
 *
 * The last enabled class toggle is disabled so users cannot reach an all-off
 * state that the storage validator would later reject.
 */
export default function ClassToggles({settings, onToggle}) {
  const enabledClassCount = CLASS_KEYS.filter((k) => settings[k]).length;

  return (
    <fieldset className="pw-toggles">
      <legend className="pw-label">Character set</legend>
      <div className="pw-toggle-grid">
        {TOGGLES.map(({key, label}) => {
          // Disable a class toggle when it is the sole remaining enabled class —
          // prevents saving an all-classes-off state that would corrupt storage.
          const isLastEnabled =
            CLASS_KEYS.includes(key) &&
            settings[key] &&
            enabledClassCount === 1;
          return (
            <label key={key} className="pw-toggle">
              <input
                type="checkbox"
                checked={!!settings[key]}
                disabled={isLastEnabled}
                onChange={(e) => onToggle(key, e.target.checked)}
              />
              <span>{label}</span>
            </label>
          );
        })}
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
