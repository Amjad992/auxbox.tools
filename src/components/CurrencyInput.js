import PropTypes from 'prop-types';
import {useId, useMemo} from 'react';

/**
 * Single-line numeric input prefixed with a currency symbol.
 *
 * The currency is derived from `Intl.NumberFormat.formatToParts` so locales
 * that prefer a code (e.g. CAD → "CA$") render natively. Falls back to the
 * raw ISO code if Intl can't resolve a symbol.
 *
 * onChange forwards the native event so consumers can use `e.target.value`
 * exactly as they would for a plain `<input>`.
 */
export default function CurrencyInput({
  id,
  label,
  helper,
  error,
  currency = 'USD',
  locale,
  className = '',
  inputClassName = '',
  ...inputProps
}) {
  const reactId = useId();
  const inputId = id || `currency-${reactId}`;
  const errorId = `${inputId}-error`;
  const helperId = helper ? `${inputId}-helper` : undefined;
  const hasError = typeof error === 'string' && error.length > 0;
  const describedBy =
    [hasError ? errorId : helperId].filter(Boolean).join(' ') || undefined;

  const symbol = useMemo(
    () => resolveSymbol(currency, locale),
    [currency, locale]
  );

  const wrapperClass = ['tool-currency-field', className]
    .filter(Boolean)
    .join(' ');
  const inputClass = ['tool-currency-input', inputClassName]
    .filter(Boolean)
    .join(' ');
  const wrapInnerClass = [
    'tool-currency-input-wrap',
    hasError ? 'tool-currency-input-wrap--error' : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClass}>
      {label && (
        <label htmlFor={inputId} className="tool-currency-label">
          {label}
        </label>
      )}
      <div className={wrapInnerClass}>
        <span className="tool-currency-symbol" aria-hidden="true">
          {symbol}
        </span>
        <input
          id={inputId}
          type="number"
          inputMode="decimal"
          className={inputClass}
          aria-invalid={hasError ? 'true' : undefined}
          aria-describedby={describedBy}
          {...inputProps}
        />
      </div>
      {hasError && (
        <span id={errorId} className="tool-currency-error" role="alert">
          {error}
        </span>
      )}
      {!hasError && helper && (
        <span id={helperId} className="tool-currency-helper">
          {helper}
        </span>
      )}
    </div>
  );
}

function resolveSymbol(currency, locale) {
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).formatToParts(0);
    const part = parts.find((p) => p.type === 'currency');
    return part?.value || currency;
  } catch {
    return currency;
  }
}

CurrencyInput.propTypes = {
  id: PropTypes.string,
  label: PropTypes.node,
  helper: PropTypes.node,
  error: PropTypes.string,
  currency: PropTypes.string,
  locale: PropTypes.string,
  className: PropTypes.string,
  inputClassName: PropTypes.string,
};
