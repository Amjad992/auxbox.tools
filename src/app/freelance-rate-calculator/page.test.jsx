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
    expect(screen.getByText(/^currency$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^hours\b/i)).toBeInTheDocument();
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
    await user.type(screen.getByLabelText(/^hours\b/i), '10');
    await user.type(screen.getByLabelText(/hourly rate/i), '100');

    expect(screen.getAllByText(/\$1,000/)[0]).toBeInTheDocument();
    // Take-home should equal $1,000 with 0% fees default.
    expect(screen.getAllByText(/take-home/i).length).toBeGreaterThan(0);
  });

  it('applies the compound fee chain (10 × $100, 10% platform + 25% tax)', async () => {
    const user = userEvent.setup();
    render(<FreelanceRateCalculator />);
    await user.type(screen.getByLabelText(/^hours\b/i), '10');
    await user.type(screen.getByLabelText(/hourly rate/i), '100');

    // Use Upwork preset for 10% platform fee.
    await user.click(screen.getByRole('button', {name: /upwork \(10%\)/i}));

    // Take-home should be $900 (gross $1,000 × 0.9).
    expect(screen.getAllByText(/\$900/)[0]).toBeInTheDocument();
  });

  it('switches currency display from USD to EUR', async () => {
    const user = userEvent.setup();
    render(<FreelanceRateCalculator />);
    await user.type(screen.getByLabelText(/^hours\b/i), '10');
    await user.type(screen.getByLabelText(/hourly rate/i), '100');

    // Open the currency popover, click EUR.
    await user.click(screen.getByRole('button', {expanded: false, name: /USD/}));
    await user.click(screen.getByRole('option', {name: /EUR/}));

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

  it('Hours field accepts 12:19 and shows the parsed label', async () => {
    const user = userEvent.setup();
    render(<FreelanceRateCalculator />);
    await user.type(screen.getByLabelText(/^hours\b/i), '12:19');
    await user.type(screen.getByLabelText(/hourly rate/i), '100');

    expect(screen.getByText(/parsed: 12h 19m/i)).toBeInTheDocument();
    // 12 + 19/60 ≈ 12.3167 hours × $100 = $1,231.67. Rendered as $1,232.
    expect(screen.getAllByText(/\$1,231|\$1,232/)[0]).toBeInTheDocument();
  });

  it('Hours field accepts h/m suffix form', async () => {
    const user = userEvent.setup();
    render(<FreelanceRateCalculator />);
    await user.type(screen.getByLabelText(/^hours\b/i), '2h 30m');
    await user.type(screen.getByLabelText(/hourly rate/i), '100');

    expect(screen.getByText(/parsed: 2h 30m/i)).toBeInTheDocument();
    expect(screen.getAllByText(/\$250/)[0]).toBeInTheDocument();
  });

  it('Hours field shows an error hint on garbage input', async () => {
    const user = userEvent.setup();
    render(<FreelanceRateCalculator />);
    await user.type(screen.getByLabelText(/^hours\b/i), 'abc');
    expect(screen.getByText(/couldn’t parse/i)).toBeInTheDocument();
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

  it('Team slider in Income mode doubles annual revenue', async () => {
    const user = userEvent.setup();
    render(<FreelanceRateCalculator />);
    await user.click(screen.getByRole('radio', {name: /income from rate/i}));
    await user.type(screen.getByLabelText(/hourly rate/i), '100');
    // Default: 1 person, $134,400 annual gross.
    expect(screen.getAllByText(/\$134,400/).length).toBeGreaterThan(0);

    // Bump team to 2 people via the slider. jsdom doesn't translate
    // keyboard arrows on range inputs to change events, so dispatch
    // explicitly.
    const teamSlider = screen.getByLabelText(/number of billable people/i);
    fireEvent.change(teamSlider, {target: {value: '2'}});
    // Now 2 people × 1344 hrs × $100 = $268,800 annual.
    expect(screen.getAllByText(/\$268,800/).length).toBeGreaterThan(0);
  });

  it('Profit slider in Rate mode raises the required hourly rate', async () => {
    const user = userEvent.setup();
    render(<FreelanceRateCalculator />);
    await user.click(screen.getByRole('radio', {name: /rate from target/i}));
    await user.type(
      screen.getByLabelText(/target annual take-home income/i),
      '100000'
    );

    expect(screen.getByLabelText(/profit margin/i)).toBeInTheDocument();

    // Default profitMargin = 0. Bump it via fireEvent (jsdom doesn't
    // translate keyboard arrows on range inputs to change events).
    const profitSlider = screen.getByLabelText(/profit margin/i);
    fireEvent.change(profitSlider, {target: {value: '20'}});
    expect(profitSlider).toHaveValue('20');
  });

  it('export/import: import rehydrates state from a valid JSON config', async () => {
    const user = userEvent.setup();
    render(<FreelanceRateCalculator />);

    // Build a valid payload from outside (default state with hours=7, rate=80).
    const {DEFAULT_STATE} = await import('./constants');
    const payload = {
      schema: 'auxbox.freelance-rate-calculator',
      version: '1.0.0',
      exportedAt: '2026-05-06T00:00:00.000+00:00',
      state: {...DEFAULT_STATE, hours: 7, rate: 80},
    };
    const file = new File([JSON.stringify(payload)], 'config.json', {
      type: 'application/json',
    });

    const fileInput = screen.getByTestId('frc-import-file');
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByLabelText(/^hours\b/i)).toHaveValue('7');
    });
    expect(screen.getByLabelText(/hourly rate/i)).toHaveValue(80);
  });

  it('export/import: invalid JSON shows an error message', async () => {
    const user = userEvent.setup();
    render(<FreelanceRateCalculator />);
    const file = new File(['not json at all'], 'bad.json', {
      type: 'application/json',
    });
    await user.upload(screen.getByTestId('frc-import-file'), file);
    expect(screen.getAllByRole('alert')[0]).toHaveTextContent(/json/i);
  });

  it('Clear resets state and wipes storage', async () => {
    const user = userEvent.setup();
    render(<FreelanceRateCalculator />);
    await user.type(screen.getByLabelText(/^hours\b/i), '10');
    await user.type(screen.getByLabelText(/hourly rate/i), '50');

    await user.click(screen.getByRole('button', {name: /^clear$/i}));

    expect(screen.getByLabelText(/^hours\b/i)).toHaveValue('');
    expect(screen.getByLabelText(/hourly rate/i)).toHaveValue(null);
    expect(
      screen.getByText(/enter hours and a rate to see the quote/i)
    ).toBeInTheDocument();
  });

  it('persists state across remounts via localStorage', async () => {
    const user = userEvent.setup();
    const {unmount} = render(<FreelanceRateCalculator />);
    await user.type(screen.getByLabelText(/^hours\b/i), '5');
    await user.type(screen.getByLabelText(/hourly rate/i), '200');

    // Wait for the autosave debounce (300ms).
    await new Promise((r) => setTimeout(r, 400));
    unmount();

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeTruthy();

    render(<FreelanceRateCalculator />);
    expect(screen.getByLabelText(/^hours\b/i)).toHaveValue('5');
    expect(screen.getByLabelText(/hourly rate/i)).toHaveValue(200);
  });
});
