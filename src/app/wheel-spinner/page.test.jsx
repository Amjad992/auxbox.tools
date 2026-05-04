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
  return screen.getByRole('button', {name: /pick one|pick next|pick last|all picked|picking/i});
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

describe('<WheelSpinner /> — auto-save', () => {
  it('persists options + presentation + sessionMode (NOT picks) to localStorage', async () => {
    vi.useFakeTimers({shouldAdvanceTime: true});
    const user = userEvent.setup({advanceTimers: vi.advanceTimersByTime});
    render(<WheelSpinner />);

    await user.type(getEntriesTextarea(), 'X\nY\nZ');
    await user.click(screen.getByRole('radio', {name: /spin wheel/i}));
    await user.click(screen.getByRole('radio', {name: /pick multiple/i}));

    // Drain the debounced save.
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
    // Picks are not in the persisted shape under any key.
    expect(parsed.data.picks).toBeUndefined();
    expect(Object.keys(parsed.data).sort()).toEqual(
      ['options', 'presentation', 'sessionMode'].sort()
    );
  });

  it('a pick in multiple mode does not put picks into localStorage', async () => {
    vi.useFakeTimers({shouldAdvanceTime: true});
    const user = userEvent.setup({advanceTimers: vi.advanceTimersByTime});
    render(<WheelSpinner />);
    await user.type(getEntriesTextarea(), 'A\nB\nC');
    await user.click(screen.getByRole('radio', {name: /pick multiple/i}));

    // Flush the debounce from the typing phase.
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
    // The textarea was unchanged, so options is still the full A,B,C list.
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
