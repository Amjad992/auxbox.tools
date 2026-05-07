import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
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
import TimestampConverter from './page';
// eslint-disable-next-line import/first
import {STORAGE_KEY} from './constants';

beforeEach(() => {
  window.localStorage.clear();
});

describe('<TimestampConverter />', () => {
  it('renders all four fields, the zone selector, and the empty state', () => {
    render(<TimestampConverter />);
    expect(
      screen.getByRole('heading', {name: /unix timestamp converter/i})
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/iso 8601/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/unix seconds/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/unix ms/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^human$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^zone$/i)).toBeInTheDocument();
  });

  it('typing Unix seconds populates ISO + ms + human', async () => {
    const user = userEvent.setup();
    render(<TimestampConverter />);
    await user.type(screen.getByLabelText(/unix seconds/i), '1700000000');

    await waitFor(() => {
      expect(screen.getByLabelText(/unix ms/i)).toHaveValue(
        '1700000000000'
      );
    });
    // ISO depends on the device's local zone; Unix 1.7e9 falls on
    // 2023-11-14 (UTC) which can be 11-14 or 11-15 in local time.
    expect(screen.getByLabelText(/iso 8601/i).value).toMatch(
      /^2023-11-(14|15)T/
    );
  });

  it('typing 13-digit ms populates the rest', async () => {
    const user = userEvent.setup();
    render(<TimestampConverter />);
    await user.type(screen.getByLabelText(/unix ms/i), '1700000000000');
    await waitFor(() => {
      expect(screen.getByLabelText(/unix seconds/i)).toHaveValue(
        '1700000000'
      );
    });
  });

  it('typing ISO populates seconds + ms', async () => {
    const user = userEvent.setup();
    render(<TimestampConverter />);
    await user.type(
      screen.getByLabelText(/iso 8601/i),
      '2024-06-15T10:30:00Z'
    );
    await waitFor(() => {
      expect(screen.getByLabelText(/unix seconds/i).value).toMatch(/^17/);
    });
  });

  it('Now button populates all fields', async () => {
    const user = userEvent.setup();
    render(<TimestampConverter />);
    await user.click(screen.getByRole('button', {name: /^now$/i}));
    expect(screen.getByLabelText(/iso 8601/i).value).not.toBe('');
    expect(screen.getByLabelText(/unix seconds/i).value).not.toBe('');
  });

  it('shows an error for unparseable input', async () => {
    const user = userEvent.setup();
    render(<TimestampConverter />);
    await user.type(screen.getByLabelText(/iso 8601/i), 'not-a-date');
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('Clear wipes all fields', async () => {
    const user = userEvent.setup();
    render(<TimestampConverter />);
    await user.click(screen.getByRole('button', {name: /^now$/i}));
    await user.click(screen.getByRole('button', {name: /^clear$/i}));
    expect(screen.getByLabelText(/iso 8601/i)).toHaveValue('');
    expect(screen.getByLabelText(/unix seconds/i)).toHaveValue('');
  });

  it('persists the chosen zone across remounts', async () => {
    const user = userEvent.setup();
    const {unmount} = render(<TimestampConverter />);
    await user.selectOptions(screen.getByLabelText(/^zone$/i), 'utc');

    await waitFor(() => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored);
      expect(parsed.data.zone).toBe('utc');
    });
    unmount();

    render(<TimestampConverter />);
    expect(screen.getByLabelText(/^zone$/i)).toHaveValue('utc');
  });
});
