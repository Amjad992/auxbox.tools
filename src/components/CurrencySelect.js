import PropTypes from 'prop-types';
import {CURRENCIES} from '../lib/currencies';

/**
 * Shared currency dropdown.
 *
 * Props:
 *  id          — forwarded to <select id> and <label htmlFor>
 *  value       — controlled currency code string (e.g. "USD")
 *  onChange    — called with the raw code string (not the event)
 *  label       — visible label text (default "Currency")
 *  labelStyle  — "full" (default) renders "USD — US Dollar"; "code" renders "USD"
 *  className   — extra class(es) on the root wrapper div
 */
export default function CurrencySelect({
  id,
  value,
  onChange,
  label = 'Currency',
  labelStyle = 'full',
  className,
}) {
  return (
    <div className={`tool-currency-select-wrap${className ? ` ${className}` : ''}`}>
      <label htmlFor={id} className="tool-currency-select-label">
        {label}
      </label>
      <select
        id={id}
        className="tool-currency-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {CURRENCIES.map((c) => (
          <option key={c.value} value={c.value}>
            {labelStyle === 'code' ? c.value : c.label}
          </option>
        ))}
      </select>
    </div>
  );
}

CurrencySelect.propTypes = {
  id: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  labelStyle: PropTypes.oneOf(['full', 'code']),
  className: PropTypes.string,
};
