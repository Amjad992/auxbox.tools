import {describe, it, expect, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CurrencySelect from './CurrencySelect';

function setup(props = {}) {
  const defaults = {
    id: 'test-currency',
    value: 'USD',
    onChange: vi.fn(),
  };
  return render(<CurrencySelect {...defaults} {...props} />);
}

describe('<CurrencySelect />', () => {
  it('renders the default label "Currency"', () => {
    setup();
    expect(screen.getByLabelText(/^currency$/i)).toBeInTheDocument();
  });

  it('renders a custom label when provided', () => {
    setup({label: 'Pick a currency'});
    expect(screen.getByLabelText(/pick a currency/i)).toBeInTheDocument();
  });

  it('renders 10 options', () => {
    setup();
    const select = screen.getByRole('combobox');
    expect(select.querySelectorAll('option')).toHaveLength(10);
  });

  it('fires onChange with the picked currency code (not the event)', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    setup({onChange});
    await user.selectOptions(screen.getByRole('combobox'), 'EUR');
    expect(onChange).toHaveBeenCalledWith('EUR');
  });

  it('labelStyle="code" renders option text as just the code (e.g. "USD")', () => {
    setup({labelStyle: 'code'});
    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveTextContent('USD');
    expect(options[0].textContent).toBe('USD');
  });

  it('labelStyle="full" (default) renders full label text (e.g. "USD — US Dollar")', () => {
    setup({labelStyle: 'full'});
    const options = screen.getAllByRole('option');
    expect(options[0].textContent).toBe('USD — US Dollar');
  });

  it('forwards id to the select element', () => {
    setup({id: 'my-select'});
    expect(screen.getByRole('combobox').id).toBe('my-select');
  });

  it('appends className to the wrapper element', () => {
    const {container} = setup({className: 'extra-class'});
    expect(container.firstChild).toHaveClass('extra-class');
  });
});
