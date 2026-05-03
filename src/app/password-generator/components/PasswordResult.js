import PropTypes from 'prop-types';
import Button from '../../../components/Button';

/**
 * Read-only password display + copy button. Tool-local.
 */
export default function PasswordResult({
  password,
  onCopy,
  onRegenerate,
  generateDisabled,
}) {
  return (
    <div className="pw-result">
      <label htmlFor="pw-output" className="pw-label">
        Generated password
      </label>
      <div className="pw-output-wrap">
        <input
          id="pw-output"
          type="text"
          readOnly
          value={password}
          className="pw-output"
          placeholder="Click Generate to create a password"
          aria-label="Generated password"
          spellCheck="false"
          autoComplete="off"
        />
      </div>
      <div className="pw-result-actions">
        <Button
          variant="primary"
          onClick={onRegenerate}
          disabled={generateDisabled}
        >
          Generate
        </Button>
        <Button variant="success" onClick={onCopy} disabled={!password}>
          Copy
        </Button>
      </div>
    </div>
  );
}

PasswordResult.propTypes = {
  password: PropTypes.string.isRequired,
  onCopy: PropTypes.func.isRequired,
  onRegenerate: PropTypes.func.isRequired,
  generateDisabled: PropTypes.bool,
};

PasswordResult.defaultProps = {
  generateDisabled: false,
};
