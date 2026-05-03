import PropTypes from 'prop-types';

export default function Actions({onSave, onClearSaved, onReset, hasSavedData}) {
  return (
    <section className="pay-actions">
      <button type="button" className="save-btn" onClick={onSave}>
        Save locally
      </button>
      <button
        type="button"
        className="clear-saved-btn"
        onClick={onClearSaved}
        disabled={!hasSavedData}
      >
        Clear saved data
      </button>
      <button type="button" className="reset-btn" onClick={onReset}>
        Reset calculator
      </button>
    </section>
  );
}

Actions.propTypes = {
  onSave: PropTypes.func.isRequired,
  onClearSaved: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  hasSavedData: PropTypes.bool,
};
