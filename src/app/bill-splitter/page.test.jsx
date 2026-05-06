import {describe, it, expect, beforeEach, vi} from 'vitest';
import {fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('next/script', () => ({
  default: ({children, dangerouslySetInnerHTML}) =>
    dangerouslySetInnerHTML ? (
      <script dangerouslySetInnerHTML={dangerouslySetInnerHTML} />
    ) : (
      <script>{children}</script>
    ),
}));

// eslint-disable-next-line import/first
import BillSplitter from './page';
// eslint-disable-next-line import/first
import {STORAGE_KEY} from './constants';

beforeEach(() => {
  window.localStorage.clear();
});

describe('<BillSplitter />', () => {
  it('renders title, two default people, and the empty-items state', () => {
    render(<BillSplitter />);
    expect(
      screen.getByRole('heading', {name: /bill splitter/i})
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue(/^person 1$/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/^person 2$/i)).toBeInTheDocument();
    expect(
      screen.getByText(/no items yet/i)
    ).toBeInTheDocument();
  });

  it('Add person appends a new person row', async () => {
    const user = userEvent.setup();
    render(<BillSplitter />);
    await user.click(screen.getByRole('button', {name: /\+ add person/i}));
    expect(screen.getByDisplayValue(/^person 3$/i)).toBeInTheDocument();
  });

  it('Remove person removes the row (but the last person can\'t be removed)', async () => {
    const user = userEvent.setup();
    render(<BillSplitter />);
    const removeButtons = screen
      .getAllByRole('button', {name: /^remove$/i})
      .filter((b) => !b.disabled);
    expect(removeButtons.length).toBe(2);
    await user.click(removeButtons[1]);
    expect(screen.queryByDisplayValue(/^person 2$/i)).not.toBeInTheDocument();
    // Now the only Remove button is disabled (last person).
    const remaining = screen.getAllByRole('button', {name: /^remove$/i});
    expect(remaining.every((b) => b.disabled)).toBe(true);
  });

  it('Add item creates an item row assigned to the first person', async () => {
    const user = userEvent.setup();
    render(<BillSplitter />);
    await user.click(screen.getByRole('button', {name: /\+ add item/i}));
    expect(screen.getByLabelText(/^item$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^amount$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/who ordered it\?/i)).toBeInTheDocument();
  });

  it('two diners + two assigned items + tax + tip → correct per-person totals', async () => {
    const user = userEvent.setup();
    render(<BillSplitter />);

    // Add an item assigned to Person 1.
    await user.click(screen.getByRole('button', {name: /\+ add item/i}));
    const item1Amount = screen.getByLabelText(/^amount$/i);
    await user.type(item1Amount, '30');

    // Add a second item; assign to Person 2.
    await user.click(screen.getByRole('button', {name: /\+ add item/i}));
    const amounts = screen.getAllByLabelText(/^amount$/i);
    await user.type(amounts[1], '20');
    const assigns = screen.getAllByLabelText(/who ordered it\?/i);
    // The second select; option for Person 2.
    fireEvent.change(assigns[1], {
      target: {value: assigns[1].options[2].value}, // [Shared, Person 1, Person 2]
    });

    // Tax 10%, Tip 20%.
    fireEvent.change(screen.getByLabelText(/tax percent/i), {
      target: {value: '10'},
    });
    fireEvent.change(screen.getByLabelText(/tip percent/i), {
      target: {value: '20'},
    });

    // Person 1 total: 30 + (30/50)*5 + (30/50)*10 = 39
    // Person 2 total: 20 + 2 + 4 = 26
    // Grand total: 65
    expect(screen.getAllByText(/\$65\.00/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\$39\.00/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\$26\.00/).length).toBeGreaterThan(0);
  });

  it('Load demo populates a populated bill', async () => {
    const user = userEvent.setup();
    render(<BillSplitter />);
    await user.click(screen.getByRole('button', {name: /load demo/i}));

    expect(screen.getAllByDisplayValue(/^Alex$/).length).toBeGreaterThan(0);
    expect(screen.getAllByDisplayValue(/^Sam$/).length).toBeGreaterThan(0);
    expect(screen.getAllByDisplayValue(/^Jordan$/).length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue(/^Bruschetta$/)).toBeInTheDocument();
  });

  it('Clear wipes back to defaults', async () => {
    const user = userEvent.setup();
    render(<BillSplitter />);
    await user.click(screen.getByRole('button', {name: /load demo/i}));
    expect(screen.getAllByDisplayValue(/^Alex$/).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', {name: /^clear$/i}));
    expect(screen.queryAllByDisplayValue(/^Alex$/)).toHaveLength(0);
    expect(screen.getByDisplayValue(/^Person 1$/)).toBeInTheDocument();
  });

  it('persists state across remounts via localStorage', async () => {
    const user = userEvent.setup();
    const {unmount} = render(<BillSplitter />);
    await user.click(screen.getByRole('button', {name: /load demo/i}));

    await waitFor(() => {
      expect(window.localStorage.getItem(STORAGE_KEY)).toBeTruthy();
    });
    unmount();

    render(<BillSplitter />);
    expect(screen.getAllByDisplayValue(/^Alex$/).length).toBeGreaterThan(0);
  });

  it('currency popover switches the displayed amounts', async () => {
    const user = userEvent.setup();
    render(<BillSplitter />);
    await user.click(screen.getByRole('button', {name: /load demo/i}));

    // Open the currency popover. The trigger renders the current code (USD).
    await user.click(screen.getByRole('button', {expanded: false, name: /USD/}));
    await user.click(screen.getByRole('option', {name: /EUR/}));

    // The result table now uses €.
    expect(screen.getAllByText(/€/).length).toBeGreaterThan(0);
  });
});

describe('<BillSplitter /> — sliders + presets', () => {
  it('tax preset chip updates the slider and recomputes', async () => {
    const user = userEvent.setup();
    render(<BillSplitter />);
    await user.click(screen.getByRole('button', {name: /load demo/i}));

    // Initial demo tax is 8%; click 10% chip.
    const taxChips = within(
      screen.getByText(/tax percent/i).closest('.tool-slider').parentElement
    ).getAllByRole('button');
    const tenChip = taxChips.find((b) => b.textContent === '10%');
    await user.click(tenChip);

    expect(screen.getByLabelText(/tax percent/i)).toHaveValue('10');
  });
});
