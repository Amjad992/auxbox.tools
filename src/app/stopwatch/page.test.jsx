import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {act, fireEvent, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Stub next/script — App Router runtime isn't available in jsdom.
vi.mock('next/script', () => ({
  default: ({children, dangerouslySetInnerHTML}) =>
    dangerouslySetInnerHTML ? (
      <script dangerouslySetInnerHTML={dangerouslySetInnerHTML} />
    ) : (
      <script>{children}</script>
    ),
}));

// eslint-disable-next-line import/first
import Stopwatch, {STORAGE_KEY} from './page';

beforeEach(() => {
  window.localStorage.clear();
  document.title = 'Test Page';
});

afterEach(() => {
  vi.useRealTimers();
});

describe('<Stopwatch /> — initial render', () => {
  it('shows the title, default 00:00.000 display, and three buttons', () => {
    render(<Stopwatch />);
    expect(screen.getByRole('heading', {name: /^stopwatch$/i})).toBeInTheDocument();
    expect(screen.getByRole('timer')).toHaveTextContent('00:00.000');
    expect(screen.getByRole('button', {name: /start/i})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /lap/i})).toBeDisabled();
    expect(screen.getByRole('button', {name: /reset/i})).toBeDisabled();
  });

  it('shows the empty laps placeholder', () => {
    render(<Stopwatch />);
    expect(screen.getByText(/no laps yet/i)).toBeInTheDocument();
  });
});

describe('<Stopwatch /> — start / stop / lap / reset', () => {
  it('clicking Start swaps to Stop and enables Lap', async () => {
    const user = userEvent.setup();
    render(<Stopwatch />);
    await user.click(screen.getByRole('button', {name: /start/i}));
    expect(screen.getByRole('button', {name: /stop/i})).toBeInTheDocument();
    expect(screen.queryByRole('button', {name: /^start$/i})).not.toBeInTheDocument();
    expect(screen.getByRole('button', {name: /lap/i})).toBeEnabled();
  });

  it('clicking Lap appends a row in the laps table', async () => {
    const user = userEvent.setup();
    const nowSpy = vi.spyOn(Date, 'now');
    nowSpy.mockReturnValue(1_000_000);
    render(<Stopwatch />);
    await user.click(screen.getByRole('button', {name: /start/i}));
    nowSpy.mockReturnValue(1_002_500);
    await user.click(screen.getByRole('button', {name: /lap/i}));
    nowSpy.mockReturnValue(1_005_000);
    await user.click(screen.getByRole('button', {name: /lap/i}));
    nowSpy.mockRestore();

    expect(screen.queryByText(/no laps yet/i)).not.toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
  });

  it('display ticks past 00:00.000 once started (rAF + Date.now advancement)', async () => {
    const user = userEvent.setup();
    let now = 1_000_000;
    const nowSpy = vi.spyOn(Date, 'now').mockImplementation(() => now);

    // Capture the rAF callback so we can manually drive a frame.
    let rafCb = null;
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCb = cb;
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    render(<Stopwatch />);
    await user.click(screen.getByRole('button', {name: /start/i}));

    // Advance the clock and drive one rAF tick.
    now = 1_002_345;
    act(() => {
      if (rafCb) rafCb(now);
    });

    const display = screen.getByRole('timer');
    expect(display.textContent).not.toBe('00:00.000');
    expect(display.textContent).toMatch(/^00:0[12]\./);

    nowSpy.mockRestore();
    rafSpy.mockRestore();
  });

  it('Reset clears state and wipes storage synchronously (no phantom write)', async () => {
    vi.useFakeTimers({shouldAdvanceTime: true});
    const user = userEvent.setup({advanceTimers: vi.advanceTimersByTime});

    // Pre-populate storage with a paused state.
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: '1.0.0',
        data: {
          status: 'paused',
          startedAt: null,
          accumulatedMs: 5_000,
          laps: [{index: 1, totalElapsedMs: 5_000, deltaMs: 5_000}],
        },
      })
    );

    render(<Stopwatch />);
    expect(screen.getByRole('button', {name: /reset/i})).toBeEnabled();

    await user.click(screen.getByRole('button', {name: /reset/i}));

    // Display back to zero, laps gone, storage wiped.
    expect(screen.getByRole('timer')).toHaveTextContent('00:00.000');
    expect(screen.getByText(/no laps yet/i)).toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();

    // Wait through the debounce window and confirm no phantom record.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    vi.useRealTimers();
  });

  it('does not write a phantom record when Reset fires within the auto-save debounce window after Start', async () => {
    vi.useFakeTimers({shouldAdvanceTime: true});
    const user = userEvent.setup({advanceTimers: vi.advanceTimersByTime});

    render(<Stopwatch />);
    await user.click(screen.getByRole('button', {name: /start/i}));

    // Advance less than STATE_AUTOSAVE_DEBOUNCE_MS (300 ms) — debounce not fired yet.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    await user.click(screen.getByRole('button', {name: /reset/i}));

    // Advance past the original Start's debounce window — dirtyRef gate must block it.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    vi.useRealTimers();
  });
});

describe('<Stopwatch /> — persistence', () => {
  it('rehydrates a paused snapshot from storage', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: '1.0.0',
        data: {
          status: 'paused',
          startedAt: null,
          accumulatedMs: 12_345,
          laps: [],
        },
      })
    );
    render(<Stopwatch />);
    // Display should render the stored elapsed.
    expect(screen.getByRole('timer')).toHaveTextContent('00:12.345');
    expect(screen.getByRole('button', {name: /reset/i})).toBeEnabled();
    // Stop is hidden (we are paused), Start available.
    expect(screen.getByRole('button', {name: /start/i})).toBeInTheDocument();
  });

  it('rehydrates a running snapshot and recomputes live elapsed from wall-clock', () => {
    const now = 1_700_000_000_000;
    const fiveSecondsAgo = now - 5_000;
    vi.spyOn(Date, 'now').mockReturnValue(now);

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: '1.0.0',
        data: {
          status: 'running',
          startedAt: fiveSecondsAgo,
          accumulatedMs: 0,
          laps: [],
        },
      })
    );
    render(<Stopwatch />);
    const display = screen.getByRole('timer');
    // ≥5 seconds — exact ms can vary by 0, expect at least 5 seconds.
    expect(display.textContent).toMatch(/^00:0[5-9]\./);
    // Stop should be the action available.
    expect(screen.getByRole('button', {name: /stop/i})).toBeInTheDocument();

    vi.restoreAllMocks();
  });

  it('persists state after Start with debounced auto-save', async () => {
    vi.useFakeTimers({shouldAdvanceTime: true});
    const user = userEvent.setup({advanceTimers: vi.advanceTimersByTime});
    render(<Stopwatch />);
    await user.click(screen.getByRole('button', {name: /start/i}));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    vi.useRealTimers();

    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw);
    expect(parsed.version).toBe('1.0.0');
    expect(parsed.data.status).toBe('running');
    expect(typeof parsed.data.startedAt).toBe('number');
  });
});

describe('<Stopwatch /> — keyboard shortcuts', () => {
  it('Space toggles start/stop when focus is on body', async () => {
    render(<Stopwatch />);
    expect(document.activeElement === document.body || document.activeElement === null).toBe(true);

    act(() => {
      fireEvent.keyDown(window, {key: ' ', code: 'Space'});
    });
    expect(screen.getByRole('button', {name: /stop/i})).toBeInTheDocument();

    act(() => {
      fireEvent.keyDown(window, {key: ' ', code: 'Space'});
    });
    expect(screen.getByRole('button', {name: /^start$/i})).toBeInTheDocument();
  });

  it('R resets when state has elapsed time', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: '1.0.0',
        data: {
          status: 'paused',
          startedAt: null,
          accumulatedMs: 3_000,
          laps: [],
        },
      })
    );
    render(<Stopwatch />);
    expect(screen.getByRole('timer')).toHaveTextContent('00:03.000');
    act(() => {
      fireEvent.keyDown(window, {key: 'r', code: 'KeyR'});
    });
    expect(screen.getByRole('timer')).toHaveTextContent('00:00.000');
  });

  it('Space inside a textarea is ignored (typing not hijacked)', async () => {
    render(
      <div>
        <Stopwatch />
        <textarea aria-label="scratch" />
      </div>
    );
    const ta = screen.getByLabelText('scratch');
    ta.focus();
    act(() => {
      fireEvent.keyDown(ta, {key: ' ', code: 'Space'});
    });
    // Still on Start — Space inside textarea was ignored.
    expect(screen.getByRole('button', {name: /^start$/i})).toBeInTheDocument();
  });

  it('L inside a textarea is ignored (typing not hijacked)', async () => {
    render(
      <div>
        <Stopwatch />
        <textarea aria-label="scratch-l" />
      </div>
    );
    // Start so a Lap would otherwise be possible.
    act(() => {
      fireEvent.keyDown(window, {key: ' ', code: 'Space'});
    });
    expect(screen.getByRole('button', {name: /stop/i})).toBeInTheDocument();

    const ta = screen.getByLabelText('scratch-l');
    ta.focus();
    act(() => {
      fireEvent.keyDown(ta, {key: 'l', code: 'KeyL'});
    });
    // No lap rows — L inside textarea was ignored.
    expect(screen.queryByText(/^#1$/)).not.toBeInTheDocument();
  });

  it('R inside a textarea is ignored (typing not hijacked)', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: '1.0.0',
        data: {
          status: 'paused',
          startedAt: null,
          accumulatedMs: 3_000,
          laps: [],
        },
      })
    );
    render(
      <div>
        <Stopwatch />
        <textarea aria-label="scratch-r" />
      </div>
    );
    // Timer should read 00:03.000 from storage.
    expect(screen.getByRole('timer')).toHaveTextContent('00:03.000');

    const ta = screen.getByLabelText('scratch-r');
    ta.focus();
    act(() => {
      fireEvent.keyDown(ta, {key: 'r', code: 'KeyR'});
    });
    // R inside textarea was ignored — timer unchanged.
    expect(screen.getByRole('timer')).toHaveTextContent('00:03.000');
  });

  it('bare contenteditable element is treated as a form-field target (L ignored)', async () => {
    render(
      <div>
        <Stopwatch />
        <div contentEditable aria-label="rich-editor" role="textbox" />
      </div>
    );
    // Start so L would otherwise record a lap.
    act(() => {
      fireEvent.keyDown(window, {key: ' ', code: 'Space'});
    });
    expect(screen.getByRole('button', {name: /stop/i})).toBeInTheDocument();

    const editor = screen.getByRole('textbox', {name: 'rich-editor'});
    editor.focus();
    act(() => {
      fireEvent.keyDown(editor, {key: 'l', code: 'KeyL'});
    });
    // No lap rows — L inside bare contenteditable was ignored.
    expect(screen.queryByText(/^#1$/)).not.toBeInTheDocument();
  });

  it('L key while running records a new lap row', async () => {
    render(<Stopwatch />);
    // Start via Space.
    act(() => {
      fireEvent.keyDown(window, {key: ' ', code: 'Space'});
    });
    expect(screen.getByRole('button', {name: /stop/i})).toBeInTheDocument();

    act(() => {
      fireEvent.keyDown(window, {key: 'l', code: 'KeyL'});
    });
    // A lap row should now appear.
    expect(screen.getByText('#1')).toBeInTheDocument();
  });

  it('L key while paused/idle does not record a lap row', async () => {
    render(<Stopwatch />);
    // Stopwatch is idle — do NOT start.
    act(() => {
      fireEvent.keyDown(window, {key: 'l', code: 'KeyL'});
    });
    // No laps created.
    expect(screen.queryByText(/^#1$/)).not.toBeInTheDocument();
    expect(screen.getByText(/no laps yet/i)).toBeInTheDocument();
  });
});
