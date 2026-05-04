import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {act, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Stub next/script — App Router runtime isn't available in jsdom.
vi.mock('next/script', () => ({
  default: ({children, dangerouslySetInnerHTML}) =>
    dangerouslySetInnerHTML
      ? <script dangerouslySetInnerHTML={dangerouslySetInnerHTML} />
      : <script>{children}</script>,
}));

// eslint-disable-next-line import/first
import DateCalculator from './page';

const STORAGE_KEY = 'date_calculator_state';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

function getStartInput() {
  return screen.getByLabelText(/start date/i);
}

function getEndInput() {
  return screen.getByLabelText(/end date/i);
}

describe('<DateCalculator /> — page render', () => {
  it('renders title, both date fields, mode toggle, and Clear button', () => {
    render(<DateCalculator />);
    expect(
      screen.getByRole('heading', {name: /date calculator/i})
    ).toBeInTheDocument();
    expect(getStartInput()).toBeInTheDocument();
    expect(getEndInput()).toBeInTheDocument();
    expect(
      screen.getByRole('radiogroup', {name: /calculation mode/i})
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radio', {name: /difference between two dates/i})
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radio', {name: /age from date/i})
    ).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /^clear$/i})).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', {name: /working days only/i})
    ).toBeInTheDocument();
  });

  it('shows the empty placeholder when no dates are picked', () => {
    render(<DateCalculator />);
    expect(
      screen.getByText(/pick two dates to see the breakdown/i)
    ).toBeInTheDocument();
  });
});

describe('<DateCalculator /> — difference computation', () => {
  it('shows years/months/days breakdown for a one-year span', async () => {
    const user = userEvent.setup();
    render(<DateCalculator />);
    await user.type(getStartInput(), '2024-01-15');
    await user.type(getEndInput(), '2025-01-15');
    expect(screen.getByText(/^1 year$/)).toBeInTheDocument();
  });

  it('surfaces the swap note when end < start', async () => {
    const user = userEvent.setup();
    render(<DateCalculator />);
    await user.type(getStartInput(), '2024-06-01');
    await user.type(getEndInput(), '2024-01-01');
    expect(
      screen.getByText(/end date was before start; showing absolute difference/i)
    ).toBeInTheDocument();
    // Still shows the breakdown.
    expect(screen.getByText(/5 months/)).toBeInTheDocument();
  });
});

describe('<DateCalculator /> — mode switching', () => {
  it('switches to Age mode and updates field labels', async () => {
    const user = userEvent.setup();
    render(<DateCalculator />);
    await user.click(screen.getByRole('radio', {name: /age from date/i}));
    expect(
      screen.getByLabelText(/birth date \(or any past date\)/i)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/on date \(defaults to today\)/i)
    ).toBeInTheDocument();
  });

  it('Age mode: end input has today populated by default', async () => {
    const user = userEvent.setup();
    render(<DateCalculator />);
    await user.click(screen.getByRole('radio', {name: /age from date/i}));
    const endInput = screen.getByLabelText(/on date \(defaults to today\)/i);
    // The displayed value should be today in yyyy-mm-dd form.
    const d = new Date();
    const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    expect(endInput.value).toBe(expected);
  });
});

describe('<DateCalculator /> — working-days toggle', () => {
  it('shows Working days line only when toggle is on', async () => {
    const user = userEvent.setup();
    render(<DateCalculator />);
    await user.type(getStartInput(), '2024-01-15');
    await user.type(getEndInput(), '2024-01-19');

    // Off by default — no Working days label.
    expect(screen.queryByText(/working days$/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', {name: /working days only/i}));
    expect(screen.getByText(/^Working days$/)).toBeInTheDocument();
    // 2024-01-15 (Mon) -> 2024-01-19 (Fri) = 5 weekdays.
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});

describe('<DateCalculator /> — auto-save round-trip', () => {
  it('persists startDate, endDate, mode, includeWorkingDays via debounced save', async () => {
    vi.useFakeTimers({shouldAdvanceTime: true});
    const user = userEvent.setup({advanceTimers: vi.advanceTimersByTime});
    render(<DateCalculator />);

    await user.type(getStartInput(), '2024-01-15');
    await user.type(getEndInput(), '2025-01-15');
    await user.click(screen.getByRole('checkbox', {name: /working days only/i}));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    vi.useRealTimers();

    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw);
    expect(parsed.version).toBe('1.0.0');
    expect(parsed.data.startDate).toBe('2024-01-15');
    expect(parsed.data.endDate).toBe('2025-01-15');
    expect(parsed.data.mode).toBe('difference');
    expect(parsed.data.includeWorkingDays).toBe(true);
  });

  it('a fresh mount with no interaction does NOT write defaults', async () => {
    vi.useFakeTimers({shouldAdvanceTime: true});
    render(<DateCalculator />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    vi.useRealTimers();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('restores persisted values on mount', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: '1.0.0',
        data: {
          startDate: '2024-02-29',
          endDate: '2025-03-01',
          mode: 'difference',
          includeWorkingDays: true,
        },
      })
    );
    render(<DateCalculator />);
    expect(getStartInput().value).toBe('2024-02-29');
    expect(getEndInput().value).toBe('2025-03-01');
    expect(
      screen.getByRole('checkbox', {name: /working days only/i})
    ).toBeChecked();
  });
});

describe('<DateCalculator /> — Clear synchronous wipe', () => {
  it('Clear empties inputs, resets mode/toggle, and wipes storage synchronously', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: '1.0.0',
        data: {
          startDate: '2024-01-15',
          endDate: '2025-01-15',
          mode: 'age',
          includeWorkingDays: true,
        },
      })
    );

    const user = userEvent.setup();
    render(<DateCalculator />);
    // Restored mode is 'age', so the start input is labelled differently.
    const restoredStart = screen.getByLabelText(/birth date/i);
    expect(restoredStart.value).toBe('2024-01-15');

    await user.click(screen.getByRole('button', {name: /^clear$/i}));

    // After Clear the mode is back to 'difference', so the label is "Start date".
    expect(getStartInput().value).toBe('');
    expect(
      screen.getByRole('checkbox', {name: /working days only/i})
    ).not.toBeChecked();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('Clear does NOT write a phantom record after the debounce window', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: '1.0.0',
        data: {
          startDate: '2024-01-15',
          endDate: '2025-01-15',
          mode: 'difference',
          includeWorkingDays: false,
        },
      })
    );

    vi.useFakeTimers({shouldAdvanceTime: true});
    const user = userEvent.setup({advanceTimers: vi.advanceTimersByTime});
    render(<DateCalculator />);

    await user.click(screen.getByRole('button', {name: /^clear$/i}));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    vi.useRealTimers();

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('Clear is disabled when there is nothing to clear', () => {
    render(<DateCalculator />);
    expect(screen.getByRole('button', {name: /^clear$/i})).toBeDisabled();
  });
});
