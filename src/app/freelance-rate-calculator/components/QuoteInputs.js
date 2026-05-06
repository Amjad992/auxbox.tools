import PropTypes from 'prop-types';
import {useEffect, useState} from 'react';
import Card from '../../../components/Card';
import CurrencyInput from '../../../components/CurrencyInput';
import {formatHoursLabel, parseHours} from '../utils';

/**
 * Hours input is a *flexible* duration field. Accepts:
 *   - decimal hours (12.5 / 12,5)
 *   - colon notation (12:19)
 *   - h/m suffixes  (12h 19m / 30m / 2h)
 *
 * The component holds the raw text locally so the user can type any of
 * those formats, and surfaces the parsed value to the parent only when
 * it's a valid number. A live "12h 19m" label below confirms the parse.
 */
export default function QuoteInputs({
  hours,
  rate,
  currency,
  onHoursChange,
  onRateChange,
}) {
  const [hoursRaw, setHoursRaw] = useState(() =>
    hours == null || hours === '' ? '' : String(hours)
  );

  // Re-sync raw text when the parent resets state (Clear, Import, etc.)
  // but only when the parsed value materially differs from what we hold.
  // When the user is mid-type and the partial doesn't parse (e.g. "12:"),
  // the parent receives null — we must NOT clobber the in-flight raw text.
  useEffect(() => {
    const ours = parseHours(hoursRaw);
    if (hours == null && ours == null) return;
    if (hours != null && Math.abs((ours ?? -1) - hours) < 1e-6) return;
    setHoursRaw(hours == null ? '' : String(hours));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hours]);

  const parsed = parseHours(hoursRaw);
  const isInvalid = hoursRaw.trim() !== '' && parsed === null;
  const parsedLabel = parsed !== null ? formatHoursLabel(parsed) : '';

  const handleHoursChange = (e) => {
    const value = e.target.value;
    setHoursRaw(value);
    const next = parseHours(value);
    onHoursChange(next);
  };

  return (
    <Card>
      <h2 className="frc-card-title">Job details</h2>
      <div className="frc-quote-inputs">
        <div className="tool-field">
          <label htmlFor="frc-hours" className="tool-field-label">
            Hours
          </label>
          <input
            id="frc-hours"
            type="text"
            inputMode="text"
            autoComplete="off"
            className={`tool-field-input${
              isInvalid ? ' tool-field-input--error' : ''
            }`}
            value={hoursRaw}
            onChange={handleHoursChange}
            placeholder="12, 12:19, or 12h 19m"
            aria-invalid={isInvalid ? 'true' : undefined}
            aria-describedby="frc-hours-hint"
          />
          <span id="frc-hours-hint" className="tool-field-helper">
            {isInvalid
              ? 'Couldn’t parse — try 12, 12.5, 12:19, or 12h 19m.'
              : parsedLabel
                ? `Parsed: ${parsedLabel}`
                : 'Decimal (12.5), colon (12:19), or h/m (12h 19m).'}
          </span>
        </div>
        <CurrencyInput
          id="frc-rate"
          label="Hourly rate"
          currency={currency}
          step="0.01"
          min="0"
          value={rate ?? ''}
          onChange={(e) => onRateChange(e.target.value)}
          placeholder="0"
        />
      </div>
    </Card>
  );
}

QuoteInputs.propTypes = {
  hours: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  rate: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  currency: PropTypes.string.isRequired,
  onHoursChange: PropTypes.func.isRequired,
  onRateChange: PropTypes.func.isRequired,
};
