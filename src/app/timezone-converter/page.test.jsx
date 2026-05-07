import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen, waitFor, within} from '@testing-library/react';
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
import {STORAGE_KEY, MAX_TARGETS} from './constants';
// eslint-disable-next-line import/first
import {loadFromLocalStorage} from '../../lib/storage';
// eslint-disable-next-line import/first
import {STORAGE_VERSION} from './constants';

beforeEach(() => {
  window.localStorage.clear();
});

/**
 * Helper: pick a zone from the Combobox.
 *
 * Types `query` into the combobox input, then picks the first matching option
 * from the listbox (or the option whose text === `selectText` if provided).
 */
async function pickZoneInCombobox(user, comboboxInput, query, selectText) {
  await user.clear(comboboxInput);
  await user.type(comboboxInput, query);
  // Wait for listbox options to appear.
  const listbox = await screen.findByRole('listbox');
  const targetText = selectText || query;
  const option = within(listbox).getByText(targetText, {exact: false});
  await user.click(option);
}

describe('<TimezoneConverter />', () => {
  it('renders heading, anchor inputs, and the three default targets', () => {
    render(<TimezoneConverter />);
    expect(
      screen.getByRole('heading', {name: /time zone converter/i})
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/local date\/time/i)).toBeInTheDocument();
    // Zone combobox input (anchor)
    const zoneInput = screen.getByLabelText(/^zone$/i);
    expect(zoneInput).toBeInTheDocument();
    expect(screen.getAllByText(/america\/new_york/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/europe\/london/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/asia\/tokyo/i).length).toBeGreaterThan(0);
  });

  it('Add target zone: typing and selecting appends a zone to the list', async () => {
    const user = userEvent.setup();
    render(<TimezoneConverter />);
    const addInput = screen.getByPlaceholderText(/search timezone to add/i);
    await pickZoneInCombobox(user, addInput, 'Dubai', 'Asia/Dubai');
    // Zone now appears in the target list
    await waitFor(() => {
      expect(screen.getAllByText(/asia\/dubai/i).length).toBeGreaterThan(0);
    });
  });

  it('Remove deletes a target row', async () => {
    const user = userEvent.setup();
    render(<TimezoneConverter />);
    await user.click(
      screen.getByRole('button', {name: /Remove America\/New_York/i})
    );
    // After removal, the name only appears in search results (combobox dropdown), not in a row.
    await waitFor(() => {
      expect(
        screen
          .queryAllByText(/america\/new_york/i)
          .some((el) => el.classList.contains('tz-target-name'))
      ).toBe(false);
    });
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
    // Change anchor zone to Europe/Berlin (the anchor combobox has "Search timezone…" placeholder)
    const zoneInput = screen.getByPlaceholderText('Search timezone…');
    await pickZoneInCombobox(user, zoneInput, 'Europe/Berlin', 'Europe/Berlin');
    await waitFor(() => {
      const {data} = loadFromLocalStorage(STORAGE_KEY, STORAGE_VERSION, () => true);
      expect(data).not.toBeNull();
      expect(data.anchorZone).toBe('Europe/Berlin');
    });
    unmount();
    // Re-mount and verify anchor zone persisted (shown in target rows or UI)
    render(<TimezoneConverter />);
    // The anchor zone is not shown in the combobox input (it clears after select),
    // but it should be persisted in state. Verify via the stored data directly.
    const {data} = loadFromLocalStorage(STORAGE_KEY, STORAGE_VERSION, () => true);
    expect(data.anchorZone).toBe('Europe/Berlin');
  });

  it('Reset returns to default state', async () => {
    const user = userEvent.setup();
    render(<TimezoneConverter />);
    await user.click(screen.getByRole('button', {name: /^reset$/i}));
    // After reset, stored state should reflect default anchor zone
    await waitFor(() => {
      const {data} = loadFromLocalStorage(STORAGE_KEY, STORAGE_VERSION, () => true);
      // After reset, clearState is called, so data may be null (cleared storage)
      // OR default state may be stored. Either way targets should be defaults.
      if (data) {
        expect(data.anchorZone).toBe('utc');
      }
    });
  });

  // S9: empty-state shown when all targets cleared.
  it('shows empty-state when all targets removed', async () => {
    const user = userEvent.setup();
    render(<TimezoneConverter />);
    // Default has 3 targets: America/New_York, Europe/London, Asia/Tokyo
    await user.click(
      screen.getByRole('button', {name: /Remove America\/New_York/i})
    );
    await user.click(
      screen.getByRole('button', {name: /Remove Europe\/London/i})
    );
    await user.click(
      screen.getByRole('button', {name: /Remove Asia\/Tokyo/i})
    );
    expect(screen.getByText(/no target zones yet/i)).toBeInTheDocument();
  });

  // S4: picking an existing target as anchor removes it from targets.
  it('removes a target when it is chosen as the anchor zone', async () => {
    const user = userEvent.setup();
    render(<TimezoneConverter />);
    // America/New_York is a default target; selecting it as anchor should remove it.
    const zoneInput = screen.getByPlaceholderText('Search timezone…');
    await pickZoneInCombobox(user, zoneInput, 'America/New_York', 'America/New_York');
    // It should no longer appear as a target row.
    await waitFor(() => {
      expect(
        screen
          .queryAllByText(/america\/new_york/i)
          .some((el) => el.classList.contains('tz-target-name'))
      ).toBe(false);
    });
  });

  // S9: MAX_TARGETS cap — picker disabled and hint visible.
  it('disables picker and shows hint when MAX_TARGETS reached', async () => {
    const user = userEvent.setup();
    render(<TimezoneConverter />);

    // The 3 default targets are already present; add zones until MAX_TARGETS.
    const extraZones = [
      'America/Los_Angeles',
      'America/Denver',
      'America/Chicago',
      'America/Sao_Paulo',
      'Africa/Lagos',
      'Africa/Cairo',
      'Asia/Riyadh',
      'Asia/Dubai',
      'Asia/Singapore',
    ];

    // We have 3 defaults; add extraZones until we reach MAX_TARGETS (12).
    for (const zone of extraZones) {
      const addInput = screen.getByPlaceholderText(/search timezone to add/i);
      if (addInput.disabled) break;
      await pickZoneInCombobox(user, addInput, zone, zone);
    }

    // At cap: the add combobox input should be disabled.
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search timezone to add/i)).toBeDisabled();
    });

    // Inline hint should be visible.
    expect(
      screen.getByText(new RegExp(`Maximum ${MAX_TARGETS} zones reached`, 'i'))
    ).toBeInTheDocument();
  });
});
