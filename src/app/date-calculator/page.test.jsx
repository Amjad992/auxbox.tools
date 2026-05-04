import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {act, render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {DateTime} from 'luxon';

// Stub next/script — App Router runtime isn't available in jsdom.
vi.mock('next/script', () => ({
  default: ({children, dangerouslySetInnerHTML}) =>
    dangerouslySetInnerHTML
      ? <script dangerouslySetInnerHTML={dangerouslySetInnerHTML} />
      : <script>{children}</script>,
}));

// react-day-picker loads style.css; jsdom can't parse it.
vi.mock('react-day-picker/style.css', () => ({}));

// eslint-disable-next-line import/first
import DateCalculator from './page';

const STORAGE_KEY = 'date_calculator_state';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

// Helpers: the DatePicker renders a text input associated with its label.
function getStartInput() {
  return screen.getByLabelText(/start date/i);
}

function getEndInput() {
  return screen.getByLabelText(/end date/i);
}

// Type a date string and tab away to commit it (onChange fires on blur).
async function typeDate(user, input, isoStr) {
  await user.clear(input);
  await user.type(input, isoStr);
  await user.tab();
}

// Compute today's ISO date string (same formula as the component).
function todayISO() {
  return DateTime.now().startOf('day').toISODate();
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

  it('shows the empty placeholder when start is not picked', () => {
    render(<DateCalculator />);
    // Start is empty; end defaults to today. Only start missing → no results.
    expect(
      screen.getByText(/pick two dates to see the breakdown/i)
    ).toBeInTheDocument();
  });

  it('end date defaults to today on mount', () => {
    render(<DateCalculator />);
    expect(getEndInput().value).toBe(todayISO());
  });
});

describe('<DateCalculator /> — difference computation', () => {
  it('shows years/months/days breakdown for a one-year span', async () => {
    const user = userEvent.setup();
    render(<DateCalculator />);
    await typeDate(user, getStartInput(), '2024-01-15');
    await typeDate(user, getEndInput(), '2025-01-15');
    expect(screen.getByText(/^1 year$/)).toBeInTheDocument();
  });

  it('surfaces the swap note when end < start', async () => {
    const user = userEvent.setup();
    render(<DateCalculator />);
    await typeDate(user, getStartInput(), '2024-06-01');
    await typeDate(user, getEndInput(), '2024-01-01');
    expect(
      screen.getByText(/end date was before start; showing absolute difference/i)
    ).toBeInTheDocument();
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
    expect(endInput.value).toBe(todayISO());
  });
});

describe('<DateCalculator /> — Today buttons', () => {
  it('Start "Today" button sets start date to today', async () => {
    const user = userEvent.setup();
    render(<DateCalculator />);
    // Click the first "Today" button (next to start).
    const todayBtns = screen.getAllByRole('button', {name: /^today$/i});
    await user.click(todayBtns[0]);
    expect(getStartInput().value).toBe(todayISO());
  });

  it('End "Today" button sets end date to today', async () => {
    const user = userEvent.setup();
    render(<DateCalculator />);
    // Set end to something else first.
    await typeDate(user, getEndInput(), '2020-01-01');
    expect(getEndInput().value).toBe('2020-01-01');
    const todayBtns = screen.getAllByRole('button', {name: /^today$/i});
    await user.click(todayBtns[1]);
    expect(getEndInput().value).toBe(todayISO());
  });
});

describe('<DateCalculator /> — working-days toggle', () => {
  it('shows Total working days card only when toggle is on', async () => {
    const user = userEvent.setup();
    render(<DateCalculator />);
    await typeDate(user, getStartInput(), '2024-01-15');
    await typeDate(user, getEndInput(), '2024-01-19');

    // Row 2 must not be present when toggle is off.
    expect(screen.queryByText(/total working days/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/total working hours/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/total working minutes/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', {name: /working days only/i}));

    // 2024-01-15 (Mon) -> 2024-01-19 (Fri) = 5 weekdays.
    expect(screen.getByText(/total working days/i)).toBeInTheDocument();
    expect(screen.getByText(/total working hours/i)).toBeInTheDocument();
    expect(screen.getByText(/total working minutes/i)).toBeInTheDocument();
    // 5 working days × 8 = 40 working hours.
    expect(screen.getByText('40')).toBeInTheDocument();
  });

  it('working hours and minutes are absent when toggle is off', async () => {
    const user = userEvent.setup();
    render(<DateCalculator />);
    await typeDate(user, getStartInput(), '2024-01-15');
    await typeDate(user, getEndInput(), '2024-01-19');

    expect(screen.queryByText(/total working hours/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/total working minutes/i)).not.toBeInTheDocument();
  });

  it('working units card shows correct values: 5 days → 40 hours, 2400 minutes', async () => {
    const user = userEvent.setup();
    render(<DateCalculator />);
    // 2024-01-15 (Mon) -> 2024-01-19 (Fri) = 5 working days.
    await typeDate(user, getStartInput(), '2024-01-15');
    await typeDate(user, getEndInput(), '2024-01-19');
    await user.click(screen.getByRole('checkbox', {name: /working days only/i}));

    expect(screen.getByText('40')).toBeInTheDocument();
    expect(screen.getByText('2,400')).toBeInTheDocument();
  });
});

describe('<DateCalculator /> — auto-save round-trip', () => {
  it('persists startDate, endDate, mode, includeWorkingDays via debounced save', async () => {
    vi.useFakeTimers({shouldAdvanceTime: true});
    const user = userEvent.setup({advanceTimers: vi.advanceTimersByTime});
    render(<DateCalculator />);

    await typeDate(user, getStartInput(), '2024-01-15');
    await typeDate(user, getEndInput(), '2025-01-15');
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

  it('restores null startDate from storage (shows empty start input)', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: '1.0.0',
        data: {
          startDate: null,
          endDate: '2025-03-01',
          mode: 'difference',
          includeWorkingDays: false,
        },
      })
    );
    render(<DateCalculator />);
    expect(getStartInput().value).toBe('');
  });
});

describe('<DateCalculator /> — Clear synchronous wipe', () => {
  it('Clear empties start, resets end to today, resets mode/toggle, and wipes storage synchronously', async () => {
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

    // After Clear: mode resets to 'difference', start is empty, end is today.
    expect(getStartInput().value).toBe('');
    expect(getEndInput().value).toBe(todayISO());
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

  it('Clear is disabled on a fresh mount (end=today, start=null = default state)', () => {
    render(<DateCalculator />);
    // Fresh mount: start=null, end=today, mode=difference, workingDays=false — nothing to clear.
    expect(screen.getByRole('button', {name: /^clear$/i})).toBeDisabled();
  });
});
