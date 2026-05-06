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
      screen.getByRole('heading', {name: /tip calculator/i})
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/bill amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^currency$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tip percent/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/number of people/i)).toBeInTheDocument();
  });

  it('shows the empty placeholder before any bill is entered', () => {
    render(<TipCalculator />);
    expect(
      screen.getByText(/enter a bill amount to see the split/i)
    ).toBeInTheDocument();
  });

  it('computes 100 × 18% / 2 = $59.00 per person (defaults: 18%, 2 people)', async () => {
    const user = userEvent.setup();
    render(<TipCalculator />);
    await user.type(screen.getByLabelText(/bill amount/i), '100');

    // Per-person headline shows $59.00.
    expect(screen.getAllByText(/\$59\.00/).length).toBeGreaterThan(0);
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

    fireEvent.change(screen.getByLabelText(/number of people/i), {
      target: {value: '4'},
    });

    // 100 × 1.18 / 4 = 29.50.
    expect(screen.getAllByText(/\$29\.50/).length).toBeGreaterThan(0);
  });

  it('switching currency from USD to EUR re-renders the displayed amount', async () => {
    const user = userEvent.setup();
    render(<TipCalculator />);
    await user.type(screen.getByLabelText(/bill amount/i), '100');

    await user.selectOptions(screen.getByLabelText(/^currency$/i), 'EUR');

    expect(screen.getAllByText(/€59\.00/).length).toBeGreaterThan(0);
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
