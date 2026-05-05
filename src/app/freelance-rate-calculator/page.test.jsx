import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
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
import FreelanceRateCalculator from './page';
// eslint-disable-next-line import/first
import {STORAGE_KEY} from './constants';

beforeEach(() => {
  window.localStorage.clear();
});

describe('<FreelanceRateCalculator /> — Quote mode', () => {
  it('renders title, mode toggle, currency selector, and Quote inputs', () => {
    render(<FreelanceRateCalculator />);
    expect(
      screen.getByRole('heading', {name: /freelance rate calculator/i})
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radiogroup', {name: /calculation mode/i})
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^hours$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hourly rate/i)).toBeInTheDocument();
  });

  it('shows the empty-state message before any input', () => {
    render(<FreelanceRateCalculator />);
    expect(
      screen.getByText(/enter hours and a rate to see the quote/i)
    ).toBeInTheDocument();
  });

  it('computes a basic quote (10 × $100 = $1,000)', async () => {
    const user = userEvent.setup();
    render(<FreelanceRateCalculator />);
    await user.type(screen.getByLabelText(/^hours$/i), '10');
    await user.type(screen.getByLabelText(/hourly rate/i), '100');

    expect(screen.getAllByText(/\$1,000/)[0]).toBeInTheDocument();
    // Take-home should equal $1,000 with 0% fees default.
    expect(screen.getAllByText(/take-home/i).length).toBeGreaterThan(0);
  });

  it('applies the compound fee chain (10 × $100, 10% platform + 25% tax)', async () => {
    const user = userEvent.setup();
    render(<FreelanceRateCalculator />);
    await user.type(screen.getByLabelText(/^hours$/i), '10');
    await user.type(screen.getByLabelText(/hourly rate/i), '100');

    // Use Upwork preset for 10% platform fee.
    await user.click(screen.getByRole('button', {name: /upwork \(10%\)/i}));

    // Take-home should be $900 (gross $1,000 × 0.9).
    expect(screen.getAllByText(/\$900/)[0]).toBeInTheDocument();
  });

  it('switches currency display from USD to EUR', async () => {
    const user = userEvent.setup();
    render(<FreelanceRateCalculator />);
    await user.type(screen.getByLabelText(/^hours$/i), '10');
    await user.type(screen.getByLabelText(/hourly rate/i), '100');

    await user.selectOptions(screen.getByLabelText(/currency/i), 'EUR');

    // Result should now use € symbol.
    expect(screen.getAllByText(/€1,000/)[0]).toBeInTheDocument();
  });

  it('Rate mode renders required-rate display + sensitivity table', async () => {
    const user = userEvent.setup();
    render(<FreelanceRateCalculator />);
    await user.click(screen.getByRole('radio', {name: /rate from target/i}));

    expect(
      screen.getByLabelText(/target annual take-home income/i)
    ).toBeInTheDocument();

    await user.type(
      screen.getByLabelText(/target annual take-home income/i),
      '100000'
    );

    // Required rate appears.
    expect(screen.getAllByText(/required hourly rate/i).length).toBeGreaterThan(0);

    // Sensitivity table renders all utilization rows.
    expect(screen.getAllByText(/50%/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/90%/).length).toBeGreaterThan(0);
    // The default 70% row is highlighted as "yours".
    expect(screen.getByText(/70% \(yours\)/)).toBeInTheDocument();
  });

  it('Income mode renders rate input, time card, and projection grid', async () => {
    const user = userEvent.setup();
    render(<FreelanceRateCalculator />);
    await user.click(screen.getByRole('radio', {name: /income from rate/i}));

    // Income-specific input.
    const rateInput = screen.getByLabelText(/hourly rate/i);
    expect(rateInput).toBeInTheDocument();
    // Time card sliders are present.
    expect(screen.getByLabelText(/hours per working day/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/billable utilization/i)).toBeInTheDocument();
    // Costs card is present.
    expect(screen.getByRole('tab', {name: /quick/i})).toBeInTheDocument();
    expect(screen.getByRole('tab', {name: /detailed/i})).toBeInTheDocument();

    await user.type(rateInput, '100');
    // Default 1344 billable hrs × $100 = $134,400 annual gross.
    expect(screen.getAllByText(/\$134,400/).length).toBeGreaterThan(0);
  });

  it('Clear resets state and wipes storage', async () => {
    const user = userEvent.setup();
    render(<FreelanceRateCalculator />);
    await user.type(screen.getByLabelText(/^hours$/i), '10');
    await user.type(screen.getByLabelText(/hourly rate/i), '50');

    await user.click(screen.getByRole('button', {name: /^clear$/i}));

    expect(screen.getByLabelText(/^hours$/i)).toHaveValue(null);
    expect(screen.getByLabelText(/hourly rate/i)).toHaveValue(null);
    expect(
      screen.getByText(/enter hours and a rate to see the quote/i)
    ).toBeInTheDocument();
  });

  it('persists state across remounts via localStorage', async () => {
    const user = userEvent.setup();
    const {unmount} = render(<FreelanceRateCalculator />);
    await user.type(screen.getByLabelText(/^hours$/i), '5');
    await user.type(screen.getByLabelText(/hourly rate/i), '200');

    // Wait for the autosave debounce (300ms).
    await new Promise((r) => setTimeout(r, 400));
    unmount();

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeTruthy();

    render(<FreelanceRateCalculator />);
    expect(screen.getByLabelText(/^hours$/i)).toHaveValue(5);
    expect(screen.getByLabelText(/hourly rate/i)).toHaveValue(200);
  });
});
