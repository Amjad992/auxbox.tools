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
import {STORAGE_KEY, MAX_TARGETS} from './constants';
// eslint-disable-next-line import/first
import {loadFromLocalStorage} from '../../lib/storage';
// eslint-disable-next-line import/first
import {STORAGE_VERSION} from './constants';

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
    // S11: query by accessible name (aria-label="Remove America/New_York (ET)")
    await user.click(
      screen.getByRole('button', {name: /Remove America\/New_York/i})
    );
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

  // S12: use loadFromLocalStorage helper; pick Europe/Berlin (not in DEFAULT_TARGETS).
  it('persists anchorZone + targets', async () => {
    const user = userEvent.setup();
    const {unmount} = render(<TimezoneConverter />);
    await user.selectOptions(screen.getByLabelText(/^zone$/i), 'Europe/Berlin');
    await waitFor(() => {
      const {data} = loadFromLocalStorage(STORAGE_KEY, STORAGE_VERSION, () => true);
      expect(data).not.toBeNull();
      expect(data.anchorZone).toBe('Europe/Berlin');
    });
    unmount();
    render(<TimezoneConverter />);
    expect(screen.getByLabelText(/^zone$/i)).toHaveValue('Europe/Berlin');
  });

  it('Reset returns to default state', async () => {
    const user = userEvent.setup();
    render(<TimezoneConverter />);
    await user.selectOptions(screen.getByLabelText(/^zone$/i), 'Asia/Tokyo');
    await user.click(screen.getByRole('button', {name: /^reset$/i}));
    expect(screen.getByLabelText(/^zone$/i)).toHaveValue('utc');
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

  // S4: changing anchor to a zone that was in picker clears pickerZone.
  it('clears pickerZone when anchor is changed to the selected picker zone', async () => {
    const user = userEvent.setup();
    render(<TimezoneConverter />);
    // Select Asia/Dubai in the picker (not a default target).
    await user.selectOptions(
      screen.getByLabelText(/add target zone/i),
      'Asia/Dubai'
    );
    // Now change the anchor zone to Asia/Dubai.
    await user.selectOptions(screen.getByLabelText(/^zone$/i), 'Asia/Dubai');
    // The Add button should now be disabled (pickerZone cleared).
    expect(screen.getByRole('button', {name: /\+ add/i})).toBeDisabled();
  });

  // S4: picking an existing target as anchor removes it from targets.
  it('removes a target when it is chosen as the anchor zone', async () => {
    const user = userEvent.setup();
    render(<TimezoneConverter />);
    // America/New_York is a default target — selecting it as anchor should remove it.
    await user.selectOptions(
      screen.getByLabelText(/^zone$/i),
      'America/New_York'
    );
    // It should no longer appear as a target row.
    expect(
      screen
        .queryAllByText(/america\/new_york/i)
        .some((el) => el.classList.contains('tz-target-name'))
    ).toBe(false);
  });

  // S9: MAX_TARGETS cap — picker disabled and hint visible.
  it('disables picker and shows hint when MAX_TARGETS reached', async () => {
    const user = userEvent.setup();
    render(<TimezoneConverter />);

    // The 3 default targets are already present; add zones until MAX_TARGETS.
    // Zones not in DEFAULT_TARGETS from ZONE_OPTIONS:
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
      const picker = screen.getByLabelText(/add target zone/i);
      if (picker.disabled) break;
      await user.selectOptions(picker, zone);
      await user.click(screen.getByRole('button', {name: /\+ add/i}));
    }

    // At cap: picker should be disabled.
    await waitFor(() => {
      expect(screen.getByLabelText(/add target zone/i)).toBeDisabled();
    });

    // Inline hint should be visible.
    expect(
      screen.getByText(new RegExp(`Maximum ${MAX_TARGETS} zones reached`, 'i'))
    ).toBeInTheDocument();
  });
});
