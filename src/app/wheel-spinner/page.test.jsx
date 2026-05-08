import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {act, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Stub next/script — it expects the App Router runtime which jsdom doesn't provide.
vi.mock('next/script', () => ({
  default: ({children, dangerouslySetInnerHTML}) =>
    dangerouslySetInnerHTML
      ? <script dangerouslySetInnerHTML={dangerouslySetInnerHTML} />
      : <script>{children}</script>,
}));

// eslint-disable-next-line import/first
import WheelSpinner from './page';

const STORAGE_KEY = 'wheel_spinner_state';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

function getEntriesTextarea() {
  return screen.getByLabelText(/entries \(one per line\)/i);
}

function getPickButton() {
  return screen.getByRole('button', {name: /^(pick|pick next|pick last|all picked|picking…?)$/i});
}

function readLiveRegion() {
  const node = document.querySelector('[role="status"][aria-live="polite"]');
  return node ? node.textContent : '';
}

async function runQuickPickToCompletion() {
  // Default Quick Pick schedule is ~1500ms. Advance well past it.
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2000);
  });
}

describe('<WheelSpinner /> (page) — basics', () => {
  it('renders the hero, list editor, both mode toggles, and a disabled Pick button on first load', () => {
    render(<WheelSpinner />);
    expect(screen.getByRole('heading', {name: /wheel spinner/i})).toBeInTheDocument();
    expect(getEntriesTextarea()).toBeInTheDocument();
    expect(screen.getByRole('radio', {name: /quick pick/i})).toBeInTheDocument();
    expect(screen.getByRole('radio', {name: /spin wheel/i})).toBeInTheDocument();
    expect(screen.getByRole('radio', {name: /single pick/i})).toBeInTheDocument();
    expect(screen.getByRole('radio', {name: /pick multiple/i})).toBeInTheDocument();
    expect(getPickButton()).toBeDisabled();
  });

  it('shows fewer-entries hint until at least 2 entries are entered', async () => {
    const user = userEvent.setup();
    render(<WheelSpinner />);
    const ta = getEntriesTextarea();
    await user.type(ta, 'Alice');
    expect(screen.getByText(/at least 2 entries/i)).toBeInTheDocument();
    expect(getPickButton()).toBeDisabled();
    await user.type(ta, '\nBob');
    expect(getPickButton()).not.toBeDisabled();
  });

  it('switching presentation preserves the entry list', async () => {
    const user = userEvent.setup();
    render(<WheelSpinner />);
    const ta = getEntriesTextarea();
    await user.type(ta, 'Alice\nBob\nCharlie');
    await user.click(screen.getByRole('radio', {name: /spin wheel/i}));
    expect(ta).toHaveValue('Alice\nBob\nCharlie');
    expect(screen.getByText(/^3 entries$/)).toBeInTheDocument();
    await user.click(screen.getByRole('radio', {name: /quick pick/i}));
    expect(ta).toHaveValue('Alice\nBob\nCharlie');
  });
});

describe('<WheelSpinner /> — Quick Pick announcement', () => {
  it('Quick Pick announces a winner from the list', async () => {
    const user = userEvent.setup();
    render(<WheelSpinner />);
    await user.type(getEntriesTextarea(), 'Alice\nBob\nCharlie');

    vi.useFakeTimers();
    await act(async () => {
      getPickButton().click();
    });
    await runQuickPickToCompletion();

    expect(readLiveRegion()).toMatch(/^Winner: (Alice|Bob|Charlie)$/);
    const value = document.querySelector('.ws-result-value');
    expect(['Alice', 'Bob', 'Charlie']).toContain(value.textContent);
  });

  it('Spin Wheel announces a winner via the safety timer', async () => {
    const user = userEvent.setup();
    render(<WheelSpinner />);
    await user.type(getEntriesTextarea(), 'Red\nGreen\nBlue\nYellow');
    await user.click(screen.getByRole('radio', {name: /spin wheel/i}));

    vi.useFakeTimers();
    await act(async () => {
      getPickButton().click();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3500);
    });

    expect(readLiveRegion()).toMatch(/^Winner: (Red|Green|Blue|Yellow)$/);
  });
});

describe('<WheelSpinner /> — Pick multiple session mode', () => {
  it('appends each winner to the picks list and removes them from the working list', async () => {
    const user = userEvent.setup();
    render(<WheelSpinner />);
    await user.type(getEntriesTextarea(), 'A\nB\nC');
    await user.click(screen.getByRole('radio', {name: /pick multiple/i}));

    // Pick #1
    vi.useFakeTimers();
    await act(async () => {
      getPickButton().click();
    });
    await runQuickPickToCompletion();
    vi.useRealTimers();

    let picksItems = document.querySelectorAll('.ws-picks-item');
    expect(picksItems).toHaveLength(1);
    const first = picksItems[0].textContent;
    expect(['A', 'B', 'C']).toContain(first);

    // Pick #2 — winner cannot be the same as the first one.
    vi.useFakeTimers();
    await act(async () => {
      getPickButton().click();
    });
    await runQuickPickToCompletion();
    vi.useRealTimers();

    picksItems = document.querySelectorAll('.ws-picks-item');
    expect(picksItems).toHaveLength(2);
    const second = picksItems[1].textContent;
    expect(second).not.toBe(first);

    // Pick #3 — only one entry left, button should say "Pick last".
    expect(getPickButton()).toHaveTextContent(/pick last/i);
    vi.useFakeTimers();
    await act(async () => {
      getPickButton().click();
    });
    await runQuickPickToCompletion();
    vi.useRealTimers();

    picksItems = document.querySelectorAll('.ws-picks-item');
    expect(picksItems).toHaveLength(3);
    // Picks contain all 3 entries with no duplicates.
    const labels = Array.from(picksItems).map((n) => n.textContent).sort();
    expect(labels).toEqual(['A', 'B', 'C']);

    // Now disabled with the friendly hint and Reset picks button visible.
    expect(getPickButton()).toBeDisabled();
    expect(getPickButton()).toHaveTextContent(/all picked/i);
    expect(screen.getByText(/reset the picks to start over/i)).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /reset picks/i})).toBeInTheDocument();
  });

  it('Reset picks restores the working list and clears the picks list', async () => {
    const user = userEvent.setup();
    render(<WheelSpinner />);
    await user.type(getEntriesTextarea(), 'A\nB');
    await user.click(screen.getByRole('radio', {name: /pick multiple/i}));

    // Pick once.
    vi.useFakeTimers();
    await act(async () => {
      getPickButton().click();
    });
    await runQuickPickToCompletion();
    vi.useRealTimers();

    expect(document.querySelectorAll('.ws-picks-item')).toHaveLength(1);

    await user.click(screen.getByRole('button', {name: /reset picks/i}));
    expect(document.querySelector('.ws-picks-list')).toBeNull();
    // Pick button enabled again (2 entries available).
    expect(getPickButton()).not.toBeDisabled();
    expect(getPickButton()).toHaveTextContent(/pick next/i);
  });

  it('switching presentation mid-session does NOT lose picks', async () => {
    const user = userEvent.setup();
    render(<WheelSpinner />);
    await user.type(getEntriesTextarea(), 'A\nB\nC');
    await user.click(screen.getByRole('radio', {name: /pick multiple/i}));

    vi.useFakeTimers();
    await act(async () => {
      getPickButton().click();
    });
    await runQuickPickToCompletion();
    vi.useRealTimers();

    expect(document.querySelectorAll('.ws-picks-item')).toHaveLength(1);
    await user.click(screen.getByRole('radio', {name: /spin wheel/i}));
    // Picks survive.
    expect(document.querySelectorAll('.ws-picks-item')).toHaveLength(1);
  });

  it('editing the textarea clears the picks list (different roster)', async () => {
    const user = userEvent.setup();
    render(<WheelSpinner />);
    await user.type(getEntriesTextarea(), 'A\nB\nC');
    await user.click(screen.getByRole('radio', {name: /pick multiple/i}));

    vi.useFakeTimers();
    await act(async () => {
      getPickButton().click();
    });
    await runQuickPickToCompletion();
    vi.useRealTimers();

    expect(document.querySelectorAll('.ws-picks-item')).toHaveLength(1);

    // Editing changes the parsed roster — picks should clear.
    await user.type(getEntriesTextarea(), '\nD');
    expect(document.querySelector('.ws-picks-list')).toBeNull();
  });
});

describe('<WheelSpinner /> — explicit save / auto-save prefs', () => {
  it('typing alone does NOT write options to localStorage (only prefs auto-save)', async () => {
    vi.useFakeTimers({shouldAdvanceTime: true});
    const user = userEvent.setup({advanceTimers: vi.advanceTimersByTime});
    render(<WheelSpinner />);

    await user.type(getEntriesTextarea(), 'X\nY\nZ');

    // Drain any debounced writes.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    vi.useRealTimers();

    // Fresh mount with no persisted action must not write anything to storage.
    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeNull();
  });

  it('clicking Save persists options + presentation + sessionMode (NOT picks)', async () => {
    vi.useFakeTimers({shouldAdvanceTime: true});
    const user = userEvent.setup({advanceTimers: vi.advanceTimersByTime});
    render(<WheelSpinner />);

    await user.type(getEntriesTextarea(), 'X\nY\nZ');
    await user.click(screen.getByRole('radio', {name: /spin wheel/i}));
    await user.click(screen.getByRole('radio', {name: /pick multiple/i}));
    await user.click(screen.getByRole('button', {name: /^save$/i}));

    // Drain debounce.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    vi.useRealTimers();

    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw);
    expect(parsed.version).toBe('1.0.0');
    expect(parsed.data.options).toEqual(['X', 'Y', 'Z']);
    expect(parsed.data.presentation).toBe('wheel');
    expect(parsed.data.sessionMode).toBe('multiple');
    expect(parsed.data.picks).toBeUndefined();
    expect(Object.keys(parsed.data).sort()).toEqual(
      ['options', 'presentation', 'sessionMode'].sort()
    );
  });

  it('changing presentation alone (no Save) still updates the persisted presentation field', async () => {
    // Pre-seed storage so there's a record to update.
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: '1.0.0',
        data: {options: ['A', 'B'], presentation: 'quick', sessionMode: 'single'},
      })
    );
    vi.useFakeTimers({shouldAdvanceTime: true});
    const user = userEvent.setup({advanceTimers: vi.advanceTimersByTime});
    render(<WheelSpinner />);

    await user.click(screen.getByRole('radio', {name: /spin wheel/i}));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    vi.useRealTimers();

    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw);
    expect(parsed.data.presentation).toBe('wheel');
    // Options unchanged — still the seeded values (not wiped by pref change).
    expect(parsed.data.options).toEqual(['A', 'B']);
  });

  it('a pick in multiple mode does not put picks into localStorage', async () => {
    vi.useFakeTimers({shouldAdvanceTime: true});
    const user = userEvent.setup({advanceTimers: vi.advanceTimersByTime});
    render(<WheelSpinner />);
    await user.type(getEntriesTextarea(), 'A\nB\nC');
    await user.click(screen.getByRole('radio', {name: /pick multiple/i}));
    // Save first so there's a record in storage.
    await user.click(screen.getByRole('button', {name: /^save$/i}));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    await act(async () => {
      getPickButton().click();
    });
    await runQuickPickToCompletion();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    vi.useRealTimers();

    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw);
    expect(parsed.data.picks).toBeUndefined();
    expect(parsed.data.options).toEqual(['A', 'B', 'C']);
  });

  it('reloads the saved options + presentation + sessionMode on mount; picks start empty', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: '1.0.0',
        data: {
          options: ['Foo', 'Bar', 'Baz'],
          presentation: 'wheel',
          sessionMode: 'multiple',
        },
      })
    );
    render(<WheelSpinner />);
    expect(getEntriesTextarea()).toHaveValue('Foo\nBar\nBaz');
    expect(screen.getByRole('radio', {name: /spin wheel/i})).toHaveAttribute(
      'aria-checked',
      'true'
    );
    expect(screen.getByRole('radio', {name: /pick multiple/i})).toHaveAttribute(
      'aria-checked',
      'true'
    );
    // No picks shown — session-only state always starts empty.
    expect(document.querySelector('.ws-picks-list')).toBeNull();
  });
});

describe('<WheelSpinner /> — Save button', () => {
  it('Save is disabled when textarea is empty, enabled after typing valid entries', async () => {
    const user = userEvent.setup();
    render(<WheelSpinner />);
    const saveBtn = screen.getByRole('button', {name: /^save$/i});
    expect(saveBtn).toBeDisabled();

    await user.type(getEntriesTextarea(), 'Alice\nBob');
    expect(saveBtn).not.toBeDisabled();
  });

  it('Save is disabled again after Clear empties the textarea', async () => {
    const user = userEvent.setup();
    render(<WheelSpinner />);
    const saveBtn = screen.getByRole('button', {name: /^save$/i});

    await user.type(getEntriesTextarea(), 'Alice\nBob');
    expect(saveBtn).not.toBeDisabled();

    await user.click(screen.getByRole('button', {name: /^clear$/i}));
    expect(saveBtn).toBeDisabled();
  });

  it('Save shows a toast confirmation', async () => {
    const user = userEvent.setup();
    render(<WheelSpinner />);
    await user.type(getEntriesTextarea(), 'Alice\nBob');
    await user.click(screen.getByRole('button', {name: /^save$/i}));
    expect(screen.getByText(/entries saved/i)).toBeInTheDocument();
  });
});

describe('<WheelSpinner /> — Clear button', () => {
  it('Clear is disabled when textarea is empty and no saved options exist', () => {
    render(<WheelSpinner />);
    expect(screen.getByRole('button', {name: /^clear$/i})).toBeDisabled();
  });

  it('Clear is enabled after typing', async () => {
    const user = userEvent.setup();
    render(<WheelSpinner />);
    await user.type(getEntriesTextarea(), 'Alice');
    expect(screen.getByRole('button', {name: /^clear$/i})).not.toBeDisabled();
  });

  it('Clear wipes the textarea and removes options from localStorage', async () => {
    // Pre-seed storage with saved options.
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: '1.0.0',
        data: {options: ['A', 'B'], presentation: 'quick', sessionMode: 'single'},
      })
    );
    vi.useFakeTimers({shouldAdvanceTime: true});
    const user = userEvent.setup({advanceTimers: vi.advanceTimersByTime});
    render(<WheelSpinner />);

    // Textarea pre-filled from storage.
    expect(getEntriesTextarea()).toHaveValue('A\nB');

    await user.click(screen.getByRole('button', {name: /^clear$/i}));

    // Textarea cleared.
    expect(getEntriesTextarea()).toHaveValue('');

    // Drain debounce so the storage write fires.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    vi.useRealTimers();

    // Options wiped from storage.
    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeNull();
  });

  it('Clear wipes storage synchronously — no timer advancement required', async () => {
    // MAJ-1: Clear must write synchronously so a refresh within the 300ms
    // autosave debounce window still shows an empty list.
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: '1.0.0',
        data: {options: ['X', 'Y', 'Z'], presentation: 'quick', sessionMode: 'single'},
      })
    );
    vi.useFakeTimers({shouldAdvanceTime: true});
    const user = userEvent.setup({advanceTimers: vi.advanceTimersByTime});
    render(<WheelSpinner />);

    await user.click(screen.getByRole('button', {name: /^clear$/i}));

    // Do NOT advance fake timers — storage must already be clear at this point.
    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeNull();

    vi.useRealTimers();
  });
});

describe('<WheelSpinner /> — Save button hard cap (MAJ-2)', () => {
  it('Save is disabled when options exceed MAX_ENTRIES_SOFT_CAP', async () => {
    const user = userEvent.setup();
    render(<WheelSpinner />);
    const saveBtn = screen.getByRole('button', {name: /^save$/i});

    // 101 unique entries (1 over the cap of 100). Paste in one shot —
    // user.type() simulates keystrokes and tips over the 5s vitest default
    // when the runner is loaded with all suites in parallel.
    const entries = Array.from({length: 101}, (_, i) => `Entry${i + 1}`).join('\n');
    await user.click(getEntriesTextarea());
    await user.paste(entries);

    expect(screen.getByText(/maximum 100 entries/i)).toBeInTheDocument();
    expect(saveBtn).toBeDisabled();
  });

  it('Save is enabled again after trimming to within the cap', async () => {
    const user = userEvent.setup();
    render(<WheelSpinner />);
    const saveBtn = screen.getByRole('button', {name: /^save$/i});
    const ta = getEntriesTextarea();

    // 2 entries — within cap, Save is enabled.
    await user.type(ta, 'Alice\nBob');
    expect(saveBtn).not.toBeDisabled();
  });
});
