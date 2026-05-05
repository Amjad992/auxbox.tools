import PropTypes from 'prop-types';
import {useId} from 'react';

/**
 * Labelled text/number input with inline error wiring.
 *
 * Renders as a stacked field by default (label above, input, optional
 * helper or error below). Pass `inline` to render label + input on a row.
 *
 * Error wiring: when `error` is a non-empty string, the input gets
 * `aria-invalid="true"`, `aria-describedby` pointing at the error span,
 * and the input + error gain `--error` modifier classes so consumer CSS
 * can style them.
 *
 * The base styles live alongside the existing input look in tools.css —
 * this component intentionally does not hard-code its own colours so any
 * tool that wants a custom palette can layer on top.
 */
export default function InputField({
  id,
  label,
  helper,
  error,
  className = '',
  inline = false,
  inputClassName = '',
  ...inputProps
}) {
  const reactId = useId();
  const inputId = id || `input-${reactId}`;
  const errorId = `${inputId}-error`;
  const helperId = helper ? `${inputId}-helper` : undefined;
  const hasError = typeof error === 'string' && error.length > 0;
  // When an error is active the helper span is not rendered, so only
  // include the id that corresponds to what's actually in the DOM.
  const describedBy = [hasError ? errorId : helperId]
    .filter(Boolean)
    .join(' ') || undefined;

  const wrapperClass = [
    'tool-field',
    inline ? 'tool-field--inline' : null,
    hasError ? 'tool-field--error' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const inputClass = [
    'tool-field-input',
    hasError ? 'tool-field-input--error' : null,
    inputClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClass}>
      {label && (
        <label htmlFor={inputId} className="tool-field-label">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={inputClass}
        aria-invalid={hasError ? 'true' : undefined}
        aria-describedby={describedBy}
        {...inputProps}
      />
      {hasError && (
        <span id={errorId} className="tool-field-error" role="alert">
          {error}
        </span>
      )}
      {!hasError && helper && (
        <span id={helperId} className="tool-field-helper">
          {helper}
        </span>
      )}
    </div>
  );
}

InputField.propTypes = {
  id: PropTypes.string,
  label: PropTypes.node,
  helper: PropTypes.node,
  error: PropTypes.string,
  className: PropTypes.string,
  inline: PropTypes.bool,
  inputClassName: PropTypes.string,
};
