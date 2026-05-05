import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {act, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {DateTime} from 'luxon';

vi.mock('next/script', () => ({
  default: ({children, dangerouslySetInnerHTML}) =>
    dangerouslySetInnerHTML
      ? <script dangerouslySetInnerHTML={dangerouslySetInnerHTML} />
      : <script>{children}</script>,
}));

// eslint-disable-next-line import/first
import CronExplainer, {STORAGE_KEY} from './page';

function getInput() {
  // Exact match to avoid colliding with the preset row's aria-label
  // ("Cron expression presets").
  return screen.getByLabelText('Cron expression');
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('<CronExplainer /> — initial render', () => {
  it('renders the heading, input, and preset chips', () => {
    render(<CronExplainer />);
    expect(
      screen.getByRole('heading', {name: /cron expression explainer/i})
    ).toBeInTheDocument();
    expect(getInput()).toBeInTheDocument();
    // 8 preset chips are documented.
    const chips = screen.getAllByRole('button', {name: /^use preset:/i});
    expect(chips).toHaveLength(8);
    expect(
      screen.getByRole('button', {name: /use preset: every minute/i})
    ).toBeInTheDocument();
  });

  it('does not render description or runs panels when input is empty', () => {
    render(<CronExplainer />);
    expect(screen.queryByTestId('ce-description')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ce-zone-note')).not.toBeInTheDocument();
  });
});

describe('<CronExplainer /> — typing → description', () => {
  it('typing a valid expression renders description and 5 runs', async () => {
    const user = userEvent.setup();
    render(<CronExplainer />);
    await user.type(getInput(), '0 9 * * 1-5');

    const desc = screen.getByTestId('ce-description');
    expect(desc).toBeInTheDocument();
    expect(desc.textContent.length).toBeGreaterThan(0);

    const list = screen.getByRole('list', {name: /upcoming fire times/i});
    const items = list.querySelectorAll('li');
    expect(items).toHaveLength(5);
  });

  it('invalid input shows error border + helper text and no description', async () => {
    const user = userEvent.setup();
    render(<CronExplainer />);
    await user.type(getInput(), 'not-a-cron');

    const input = getInput();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.className).toMatch(/ce-input--error/);
    // role="alert" on the helper text in the error path.
    expect(screen.getByRole('alert')).toHaveTextContent(/cron expression is invalid/i);
    expect(screen.queryByTestId('ce-description')).not.toBeInTheDocument();
  });
});

describe('<CronExplainer /> — preset chips', () => {
  it('clicking a preset fills the input', async () => {
    const user = userEvent.setup();
    render(<CronExplainer />);
    await user.click(
      screen.getByRole('button', {name: /use preset: weekdays at 9 am/i})
    );
    expect(getInput()).toHaveValue('0 9 * * 1-5');
    expect(screen.getByTestId('ce-description')).toBeInTheDocument();
  });
});

describe('<CronExplainer /> — auto-save round-trip', () => {
  it('typing persists the expression via debounced auto-save', async () => {
    vi.useFakeTimers({shouldAdvanceTime: true});
    const user = userEvent.setup({advanceTimers: vi.advanceTimersByTime});
    render(<CronExplainer />);

    await user.type(getInput(), '*/15 * * * *');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    vi.useRealTimers();

    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw);
    expect(parsed.version).toBe('1.0.0');
    expect(parsed.data.expression).toBe('*/15 * * * *');
  });

  it('a fresh mount with no typing does NOT write defaults to localStorage', async () => {
    vi.useFakeTimers({shouldAdvanceTime: true});
    render(<CronExplainer />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    vi.useRealTimers();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('restores the persisted expression on mount', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({version: '1.0.0', data: {expression: '0 0 1 * *'}})
    );
    render(<CronExplainer />);
    expect(getInput()).toHaveValue('0 0 1 * *');
    expect(screen.getByTestId('ce-description')).toBeInTheDocument();
  });
});

describe('<CronExplainer /> — local time-zone footer', () => {
  it('renders the actual zone name from Luxon', async () => {
    const user = userEvent.setup();
    render(<CronExplainer />);
    await user.type(getInput(), '* * * * *');

    const note = screen.getByTestId('ce-zone-note');
    const zone = DateTime.now().zoneName;
    expect(note).toHaveTextContent(zone);
    expect(note).toHaveTextContent(/local time zone/i);
  });
});
