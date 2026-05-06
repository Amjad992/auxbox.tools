import {describe, it, expect, beforeEach, vi} from 'vitest';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
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
import TipCalculator from './page';
// eslint-disable-next-line import/first
import {STORAGE_KEY} from './constants';

beforeEach(() => {
  window.localStorage.clear();
});

describe('<TipCalculator /> — page render', () => {
  it('renders the title, bill input, currency selector, and sliders', () => {
    render(<TipCalculator />);
    expect(
      screen.getByRole('heading', {name: /bill\s*&\s*tip calculator/i})
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/bill amount/i)).toBeInTheDocument();
    expect(screen.getByText(/^currency$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tip percent/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/number of people/i)).toBeInTheDocument();
  });

  it('shows the empty placeholder before any bill is entered', () => {
    render(<TipCalculator />);
    expect(
      screen.getByText(/enter a bill amount to see the split/i)
    ).toBeInTheDocument();
  });

  it('default tip is 0%: $100 / 2 people = $50.00 per person', async () => {
    const user = userEvent.setup();
    render(<TipCalculator />);
    await user.type(screen.getByLabelText(/bill amount/i), '100');

    // Default tipPct is 0% so total == bill; per person of 2 = $50.00.
    expect(screen.getAllByText(/\$50\.00/).length).toBeGreaterThan(0);
  });

  it('5% and 10% presets are visible and selectable', async () => {
    const user = userEvent.setup();
    render(<TipCalculator />);
    await user.type(screen.getByLabelText(/bill amount/i), '100');

    expect(screen.getByRole('button', {name: /^5%$/})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /^10%$/})).toBeInTheDocument();

    await user.click(screen.getByRole('button', {name: /^10%$/}));
    // 100 × 1.10 / 2 = $55.00.
    expect(screen.getAllByText(/\$55\.00/).length).toBeGreaterThan(0);
  });

  it('preset chip 25% updates the slider value and recomputes', async () => {
    const user = userEvent.setup();
    render(<TipCalculator />);
    await user.type(screen.getByLabelText(/bill amount/i), '100');

    await user.click(screen.getByRole('button', {name: /^25%$/}));

    // Total = 125, per person of 2 = $62.50.
    expect(screen.getAllByText(/\$62\.50/).length).toBeGreaterThan(0);
  });

  it('changing people slider updates per-person amount', async () => {
    const user = userEvent.setup();
    render(<TipCalculator />);
    await user.type(screen.getByLabelText(/bill amount/i), '100');
    // Use the 20% preset to give the math a non-zero tip leg.
    await user.click(screen.getByRole('button', {name: /^20%$/}));

    fireEvent.change(screen.getByLabelText(/number of people/i), {
      target: {value: '4'},
    });

    // 100 × 1.20 / 4 = 30.00.
    expect(screen.getAllByText(/\$30\.00/).length).toBeGreaterThan(0);
  });

  it('switching currency from USD to EUR re-renders the displayed amount', async () => {
    const user = userEvent.setup();
    render(<TipCalculator />);
    await user.type(screen.getByLabelText(/bill amount/i), '100');

    // Open the currency popover, click the EUR row.
    await user.click(screen.getByRole('button', {expanded: false, name: /USD/}));
    await user.click(screen.getByRole('option', {name: /EUR/}));

    // Default tipPct = 0%, 2 people → €50.00 each.
    expect(screen.getAllByText(/€50\.00/).length).toBeGreaterThan(0);
  });

  it('Clear resets all state and wipes storage', async () => {
    const user = userEvent.setup();
    render(<TipCalculator />);
    await user.type(screen.getByLabelText(/bill amount/i), '50');

    await user.click(screen.getByRole('button', {name: /^clear$/i}));

    expect(screen.getByLabelText(/bill amount/i)).toHaveValue(null);
    expect(
      screen.getByText(/enter a bill amount to see the split/i)
    ).toBeInTheDocument();
  });

  it('persists state across remounts via localStorage', async () => {
    const user = userEvent.setup();
    const {unmount} = render(<TipCalculator />);
    await user.type(screen.getByLabelText(/bill amount/i), '42');
    fireEvent.change(screen.getByLabelText(/number of people/i), {
      target: {value: '5'},
    });

    // Wait for the autosave debounce (deterministic poll instead of a
    // wall-clock setTimeout — slow runners get unbounded retries up to
    // waitFor's default 1 s, fast runners exit immediately when the
    // localStorage entry appears).
    await waitFor(() => {
      expect(window.localStorage.getItem(STORAGE_KEY)).toBeTruthy();
    });
    unmount();

    render(<TipCalculator />);
    expect(screen.getByLabelText(/bill amount/i)).toHaveValue(42);
    expect(screen.getByLabelText(/number of people/i)).toHaveValue('5');
  });
});
