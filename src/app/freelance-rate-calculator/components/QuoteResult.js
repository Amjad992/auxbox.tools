import PropTypes from 'prop-types';
import Card from '../../../components/Card';
import {formatCurrency} from '../../../lib/format';

export default function QuoteResult({result, currency, hours}) {
  const hasInput = hours > 0;
  return (
    <Card>
      <h2 className="frc-card-title">Quote</h2>
      <div className="frc-quote-result" aria-live="polite">
        {hasInput ? (
          <>
            <Line label="Quote total" value={result.gross} bold currency={currency} />
            {result.breakdown.platform > 0 && (
              <Line
                label="Less platform fee"
                value={-result.breakdown.platform}
                currency={currency}
                deduction
              />
            )}
            {result.breakdown.processor > 0 && (
              <Line
                label="Less processor fee"
                value={-result.breakdown.processor}
                currency={currency}
                deduction
              />
            )}
            {result.breakdown.other > 0 && (
              <Line
                label="Less other fees"
                value={-result.breakdown.other}
                currency={currency}
                deduction
              />
            )}
            {result.breakdown.income > 0 && (
              <Line
                label="Less income tax"
                value={-result.breakdown.income}
                currency={currency}
                deduction
              />
            )}
            <div className="frc-quote-divider" />
            <Line
              label="Take-home"
              value={result.net}
              currency={currency}
              primary
            />
            <p className="frc-quote-footnote">
              Effective hourly rate after fees: {formatCurrency(result.effectiveHourly, currency)}
            </p>
          </>
        ) : (
          <p className="frc-quote-empty">
            Enter hours and a rate to see the quote breakdown.
          </p>
        )}
      </div>
    </Card>
  );
}

function Line({label, value, currency, bold, primary, deduction}) {
  const cls = [
    'frc-quote-line',
    bold ? 'frc-quote-line--bold' : null,
    primary ? 'frc-quote-line--primary' : null,
    deduction ? 'frc-quote-line--deduction' : null,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={cls}>
      <span>{label}</span>
      <span className="frc-quote-amount">
        {formatCurrency(value, currency)}
      </span>
    </div>
  );
}

Line.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  currency: PropTypes.string.isRequired,
  bold: PropTypes.bool,
  primary: PropTypes.bool,
  deduction: PropTypes.bool,
};

QuoteResult.propTypes = {
  result: PropTypes.shape({
    gross: PropTypes.number.isRequired,
    net: PropTypes.number.isRequired,
    effectiveHourly: PropTypes.number.isRequired,
    breakdown: PropTypes.object.isRequired,
  }).isRequired,
  currency: PropTypes.string.isRequired,
  hours: PropTypes.number.isRequired,
};
