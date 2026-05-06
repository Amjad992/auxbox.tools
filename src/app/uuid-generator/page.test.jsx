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
import UuidGenerator from './page';
// eslint-disable-next-line import/first
import {STORAGE_KEY} from './constants';

beforeEach(() => {
  window.localStorage.clear();
});

describe('<UuidGenerator />', () => {
  it('renders heading, type radios, count slider, and the empty state', () => {
    render(<UuidGenerator />);
    expect(
      screen.getByRole('heading', {name: /uuid generator/i})
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/uuid v4/i)).toBeChecked();
    expect(screen.getByLabelText(/uuid v7/i)).not.toBeChecked();
    expect(screen.getByLabelText(/^count$/i)).toBeInTheDocument();
    expect(
      screen.getByText((_, el) =>
        el?.tagName === 'P' &&
        /to create 10\b/i.test(el.textContent ?? '')
      )
    ).toBeInTheDocument();
  });

  it('count slider updates the empty-state message', async () => {
    render(<UuidGenerator />);
    fireEvent.change(screen.getByLabelText(/^count$/i), {
      target: {value: '25'},
    });
    expect(
      screen.getByText((_, el) =>
        el?.tagName === 'P' &&
        /to create 25\b/i.test(el.textContent ?? '')
      )
    ).toBeInTheDocument();
  });

  it('Generate populates the list with 10 v4 UUIDs by default', async () => {
    const user = userEvent.setup();
    render(<UuidGenerator />);
    await user.click(screen.getByRole('button', {name: /^generate$/i}));

    const rows = screen.getAllByText(
      /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/
    );
    expect(rows.length).toBe(10);
  });

  it('switching to v7 wipes the previous batch', async () => {
    const user = userEvent.setup();
    render(<UuidGenerator />);
    await user.click(screen.getByRole('button', {name: /^generate$/i}));
    expect(
      screen.getAllByText(
        /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/
      ).length
    ).toBe(10);

    await user.click(screen.getByLabelText(/uuid v7/i));
    expect(
      screen.queryAllByText(
        /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/
      ).length
    ).toBe(0);
    expect(
      screen.getByText((_, el) =>
        el?.tagName === 'P' &&
        /to create 10\b/i.test(el.textContent ?? '')
      )
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', {name: /^generate$/i}));
    expect(
      screen.getAllByText(
        /[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/
      ).length
    ).toBe(10);
  });

  it('preset chip 50 sets count and Generate produces 50 UUIDs', async () => {
    const user = userEvent.setup();
    render(<UuidGenerator />);
    await user.click(screen.getByRole('button', {name: /^50$/}));
    await user.click(screen.getByRole('button', {name: /^generate$/i}));
    expect(
      screen.getAllByText(
        /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/
      ).length
    ).toBe(50);
  });

  it('Copy all and Download buttons are disabled until Generate is clicked', () => {
    render(<UuidGenerator />);
    expect(screen.getByRole('button', {name: /^copy all$/i})).toBeDisabled();
    expect(screen.getByRole('button', {name: /^download \.txt$/i})).toBeDisabled();
  });

  it('Clear wipes generated batch + resets state', async () => {
    const user = userEvent.setup();
    render(<UuidGenerator />);
    await user.click(screen.getByLabelText(/uuid v7/i));
    fireEvent.change(screen.getByLabelText(/^count$/i), {
      target: {value: '25'},
    });
    await user.click(screen.getByRole('button', {name: /^generate$/i}));

    await user.click(screen.getByRole('button', {name: /^clear$/i}));
    expect(screen.getByLabelText(/uuid v4/i)).toBeChecked();
    expect(
      screen.getByText((_, el) =>
        el?.tagName === 'P' &&
        /to create 10\b/i.test(el.textContent ?? '')
      )
    ).toBeInTheDocument();
  });

  it('persists type + count across remounts', async () => {
    const user = userEvent.setup();
    const {unmount} = render(<UuidGenerator />);
    await user.click(screen.getByLabelText(/uuid v7/i));
    fireEvent.change(screen.getByLabelText(/^count$/i), {
      target: {value: '5'},
    });

    await waitFor(() => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored);
      expect(parsed.data.type).toBe('v7');
      expect(parsed.data.count).toBe(5);
    });
    unmount();

    render(<UuidGenerator />);
    expect(screen.getByLabelText(/uuid v7/i)).toBeChecked();
    expect(
      screen.getByText((_, el) =>
        el?.tagName === 'P' &&
        /to create 5\b/i.test(el.textContent ?? '')
      )
    ).toBeInTheDocument();
  });
});
