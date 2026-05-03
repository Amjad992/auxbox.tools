import PropTypes from 'prop-types';
import Button from '../../../components/Button';

export default function Actions({onSave, onClearSaved, onReset, hasSavedData}) {
  return (
    <section className="pay-actions">
      <Button variant="success" onClick={onSave}>
        Save locally
      </Button>
      <Button
        variant="neutral"
        onClick={onClearSaved}
        disabled={!hasSavedData}
      >
        Clear saved data
      </Button>
      <Button variant="warning" onClick={onReset}>
        Reset calculator
      </Button>
    </section>
  );
}

Actions.propTypes = {
  onSave: PropTypes.func.isRequired,
  onClearSaved: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  hasSavedData: PropTypes.bool,
};
