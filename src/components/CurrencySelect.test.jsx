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
  it('renders the default label "Currency" and the trigger button', () => {
    setup();
    expect(screen.getByText(/^currency$/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', {expanded: false})
    ).toBeInTheDocument();
  });

  it('renders a custom label when provided', () => {
    setup({label: 'Pick a currency'});
    expect(screen.getByText(/pick a currency/i)).toBeInTheDocument();
  });

  it('opens the listbox on trigger click', async () => {
    const user = userEvent.setup();
    setup();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(10);
  });

  it('selecting an option fires onChange with the picked code and closes', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    setup({onChange});
    await user.click(screen.getByRole('button'));
    await user.click(screen.getByRole('option', {name: /EUR/}));
    expect(onChange).toHaveBeenCalledWith('EUR');
    // Listbox closes after selection.
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('marks the current value with aria-selected', async () => {
    const user = userEvent.setup();
    setup({value: 'GBP'});
    await user.click(screen.getByRole('button'));
    const selected = screen
      .getAllByRole('option')
      .find((o) => o.getAttribute('aria-selected') === 'true');
    expect(selected).toHaveTextContent('GBP');
  });

  it('Escape closes the listbox and refocuses the trigger', async () => {
    const user = userEvent.setup();
    setup();
    const trigger = screen.getByRole('button');
    await user.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('arrow-down + Enter selects the next currency', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    setup({value: 'USD', onChange});
    await user.click(screen.getByRole('button'));
    await user.keyboard('{ArrowDown}{Enter}');
    // From USD (index 0), arrow-down goes to EUR (index 1).
    expect(onChange).toHaveBeenCalledWith('EUR');
  });

  it('forwards id to the trigger button', () => {
    setup({id: 'my-select'});
    expect(screen.getByRole('button')).toHaveAttribute('id', 'my-select');
  });

  it('applies className to the wrapper', () => {
    const {container} = setup({className: 'extra-class'});
    expect(container.firstChild).toHaveClass('extra-class');
  });
});
