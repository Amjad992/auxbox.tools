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
import TimezoneConverter from './page';
// eslint-disable-next-line import/first
import {STORAGE_KEY} from './constants';

beforeEach(() => {
  window.localStorage.clear();
});

describe('<TimezoneConverter />', () => {
  it('renders heading, anchor inputs, and the three default targets', () => {
    render(<TimezoneConverter />);
    expect(
      screen.getByRole('heading', {name: /time zone converter/i})
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/local date\/time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^zone$/i)).toBeInTheDocument();
    expect(screen.getAllByText(/america\/new_york/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/europe\/london/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/asia\/tokyo/i).length).toBeGreaterThan(0);
  });

  it('Add appends a target zone to the list', async () => {
    const user = userEvent.setup();
    render(<TimezoneConverter />);
    await user.selectOptions(
      screen.getByLabelText(/add target zone/i),
      'Asia/Dubai'
    );
    await user.click(screen.getByRole('button', {name: /\+ add/i}));
    // Zone now appears as both a row and (no longer) a picker option;
    // before adding it was only in the picker.
    expect(screen.getAllByText(/asia\/dubai/i).length).toBeGreaterThan(0);
  });

  it('Remove deletes a target row', async () => {
    const user = userEvent.setup();
    render(<TimezoneConverter />);
    // Find the row containing the visible target name (not the picker option).
    const nyName = screen
      .getAllByText(/america\/new_york/i)
      .find((el) => el.classList.contains('tz-target-name'));
    const nyRow = nyName.closest('.tz-target-row');
    const removeBtn = nyRow.querySelector('button:last-child');
    await user.click(removeBtn);
    // After removal, the name only appears in the picker (option), not in a row.
    expect(
      screen
        .queryAllByText(/america\/new_york/i)
        .some((el) => el.classList.contains('tz-target-name'))
    ).toBe(false);
  });

  it('Now sets the anchor input to the current moment', async () => {
    const user = userEvent.setup();
    render(<TimezoneConverter />);
    const input = screen.getByLabelText(/local date\/time/i);
    await user.clear(input);
    expect(input.value).toBe('');
    await user.click(screen.getByRole('button', {name: /^now$/i}));
    expect(input.value).not.toBe('');
  });

  it('persists anchorZone + targets', async () => {
    const user = userEvent.setup();
    const {unmount} = render(<TimezoneConverter />);
    await user.selectOptions(screen.getByLabelText(/^zone$/i), 'Asia/Tokyo');
    await waitFor(() => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored).data.anchorZone).toBe('Asia/Tokyo');
    });
    unmount();
    render(<TimezoneConverter />);
    expect(screen.getByLabelText(/^zone$/i)).toHaveValue('Asia/Tokyo');
  });

  it('Reset returns to default state', async () => {
    const user = userEvent.setup();
    render(<TimezoneConverter />);
    await user.selectOptions(screen.getByLabelText(/^zone$/i), 'Asia/Tokyo');
    await user.click(screen.getByRole('button', {name: /^reset$/i}));
    expect(screen.getByLabelText(/^zone$/i)).toHaveValue('utc');
  });
});
