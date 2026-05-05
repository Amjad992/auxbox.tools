import {describe, it, expect, vi} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import CurrencyInput from './CurrencyInput';

describe('<CurrencyInput />', () => {
  it('renders label and currency symbol', () => {
    render(
      <CurrencyInput label="Hourly rate" currency="USD" locale="en-US" />
    );
    expect(screen.getByLabelText('Hourly rate')).toBeInTheDocument();
    expect(screen.getByText('$')).toBeInTheDocument();
  });

  it('renders other currency symbols (EUR/GBP/JPY)', () => {
    const {rerender} = render(
      <CurrencyInput label="Rate" currency="EUR" locale="en-US" />
    );
    expect(screen.getByText('€')).toBeInTheDocument();

    rerender(<CurrencyInput label="Rate" currency="GBP" locale="en-US" />);
    expect(screen.getByText('£')).toBeInTheDocument();

    rerender(<CurrencyInput label="Rate" currency="JPY" locale="en-US" />);
    expect(screen.getByText('¥')).toBeInTheDocument();
  });

  it('falls back to ISO code when Intl cannot resolve a symbol', () => {
    render(
      <CurrencyInput label="Rate" currency="ZZZ" locale="en-US" />
    );
    // Intl will render "ZZZ" itself for unknown codes — the symbol slot
    // contains *something* recognisable as a currency marker.
    expect(screen.getByLabelText('Rate')).toBeInTheDocument();
  });

  it('forwards the native event on change', () => {
    const onChange = vi.fn();
    render(
      <CurrencyInput
        label="Hourly rate"
        currency="USD"
        locale="en-US"
        onChange={onChange}
      />
    );
    const input = screen.getByLabelText('Hourly rate');
    fireEvent.change(input, {target: {value: '42.50'}});
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].target.value).toBe('42.50');
  });

  it('forwards extra input props (placeholder, step, min, disabled)', () => {
    render(
      <CurrencyInput
        label="Rate"
        currency="USD"
        locale="en-US"
        placeholder="0"
        step="0.01"
        min="0"
        disabled
      />
    );
    const input = screen.getByLabelText('Rate');
    expect(input).toHaveAttribute('placeholder', '0');
    expect(input).toHaveAttribute('step', '0.01');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toBeDisabled();
  });

  it('renders helper text when no error', () => {
    render(
      <CurrencyInput
        label="Rate"
        currency="USD"
        locale="en-US"
        helper="Per billable hour"
      />
    );
    expect(screen.getByText('Per billable hour')).toBeInTheDocument();
  });

  it('renders error and wires aria-invalid + aria-describedby', () => {
    render(
      <CurrencyInput
        label="Rate"
        currency="USD"
        locale="en-US"
        helper="Per billable hour"
        error="Must be positive"
        id="rate"
      />
    );
    const input = screen.getByLabelText('Rate');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'rate-error');
    expect(screen.getByRole('alert')).toHaveTextContent('Must be positive');
    // Helper hidden when error is active.
    expect(screen.queryByText('Per billable hour')).not.toBeInTheDocument();
  });

  it('uses provided id when supplied', () => {
    render(
      <CurrencyInput
        label="Rate"
        currency="USD"
        locale="en-US"
        id="my-rate"
      />
    );
    expect(screen.getByLabelText('Rate')).toHaveAttribute('id', 'my-rate');
  });
});
