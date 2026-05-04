import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {act, render, screen, fireEvent} from '@testing-library/react';
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
import PomodoroTimer, {STORAGE_KEY} from './page';

beforeEach(() => {
  window.localStorage.clear();
  document.title = 'Test Page';
});

afterEach(() => {
  vi.useRealTimers();
  // Tear down any Notification stub installed by individual tests.
  if ('Notification' in globalThis) {
    delete globalThis.Notification;
  }
});

function readPersisted() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  return JSON.parse(raw);
}

describe('<PomodoroTimer /> — initial render', () => {
  it('shows title, default 25:00 display, Work pill, and the action buttons', () => {
    render(<PomodoroTimer />);
    expect(
      screen.getByRole('heading', {name: /pomodoro timer/i})
    ).toBeInTheDocument();
    expect(screen.getByRole('timer')).toHaveTextContent('25:00');
    expect(screen.getByLabelText(/current phase: work/i)).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /^start$/i})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /skip phase/i})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /^reset$/i})).toBeDisabled();
  });

  it('renders the 7-day history strip', () => {
    render(<PomodoroTimer />);
    const list = screen.getByRole('list', {name: /last 7 days/i});
    expect(list.querySelectorAll('[role="listitem"]')).toHaveLength(7);
  });
});

describe('<PomodoroTimer /> — start / skip / reset', () => {
  it('Start swaps to Pause and the timer ticks below 25:00', async () => {
    const user = userEvent.setup();
    let now = 1_700_000_000_000;
    const nowSpy = vi.spyOn(Date, 'now').mockImplementation(() => now);
    let rafCb = null;
    const rafSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb) => {
        rafCb = cb;
        return 1;
      });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    render(<PomodoroTimer />);
    await user.click(screen.getByRole('button', {name: /^start$/i}));
    expect(screen.getByRole('button', {name: /^pause$/i})).toBeInTheDocument();

    now = now + 5_000;
    act(() => {
      if (rafCb) rafCb(now);
    });
    expect(screen.getByRole('timer').textContent).toMatch(/^24:5[0-9]$/);

    nowSpy.mockRestore();
    rafSpy.mockRestore();
  });

  it('Skip advances Work → Short break (paused) without bumping history', async () => {
    const user = userEvent.setup();
    render(<PomodoroTimer />);
    await user.click(screen.getByRole('button', {name: /skip phase/i}));
    expect(
      screen.getByLabelText(/current phase: short break/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /^start$/i})).toBeInTheDocument();
    // Display now reads 5:00 (default short-break minutes).
    expect(screen.getByRole('timer')).toHaveTextContent('05:00');
  });

  it('Reset wipes runtime synchronously, preserves settings + history', async () => {
    vi.useFakeTimers({shouldAdvanceTime: true});
    const user = userEvent.setup({advanceTimers: vi.advanceTimersByTime});

    // Pre-populate storage with a paused state mid-work and some history.
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: '1.0.0',
        data: {
          settings: {
            workMinutes: 30,
            shortBreakMinutes: 5,
            longBreakMinutes: 15,
            longBreakEvery: 4,
            muted: false,
            notifyEnabled: false,
          },
          runtime: {
            phase: 'work',
            status: 'paused',
            startedAt: null,
            accumulatedMs: 60_000,
            completedWorkSessions: 2,
          },
          history: {'2026-05-04': {completedPomodoros: 3}},
        },
      })
    );

    render(<PomodoroTimer />);
    expect(screen.getByRole('button', {name: /^reset$/i})).toBeEnabled();

    await user.click(screen.getByRole('button', {name: /^reset$/i}));

    // Display back to a fresh 30:00 (workMinutes preserved).
    expect(screen.getByRole('timer')).toHaveTextContent('30:00');
    // Auto-save debounce window passes — runtime stays defaulted, no phantom.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    const persisted = readPersisted();
    expect(persisted).not.toBeNull();
    expect(persisted.data.runtime).toEqual({
      phase: 'work',
      status: 'idle',
      startedAt: null,
      accumulatedMs: 0,
      completedWorkSessions: 0,
    });
    // Settings + history survived the reset.
    expect(persisted.data.settings.workMinutes).toBe(30);
    expect(persisted.data.history['2026-05-04'].completedPomodoros).toBe(3);
    vi.useRealTimers();
  });
});

describe('<PomodoroTimer /> — mute toggle suppresses Audio.play', () => {
  it('does not call Audio.play when muted on phase completion', async () => {
    const playSpy = vi.fn().mockResolvedValue(undefined);
    const audioInstances = [];
    const AudioStub = vi.fn().mockImplementation(() => {
      const inst = {play: playSpy, currentTime: 0};
      audioInstances.push(inst);
      return inst;
    });
    vi.stubGlobal('Audio', AudioStub);

    const user = userEvent.setup();
    let now = 1_700_000_000_000;
    const nowSpy = vi.spyOn(Date, 'now').mockImplementation(() => now);
    let rafCb = null;
    const rafSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb) => {
        rafCb = cb;
        return 1;
      });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    // Pre-seed with mute=on and a 1-minute work duration so the phase ends fast.
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: '1.0.0',
        data: {
          settings: {
            workMinutes: 1,
            shortBreakMinutes: 5,
            longBreakMinutes: 15,
            longBreakEvery: 4,
            muted: true,
            notifyEnabled: false,
          },
          runtime: {
            phase: 'work',
            status: 'idle',
            startedAt: null,
            accumulatedMs: 0,
            completedWorkSessions: 0,
          },
          history: {},
        },
      })
    );

    render(<PomodoroTimer />);
    await user.click(screen.getByRole('button', {name: /^start$/i}));

    // Cross the 60_000 ms work duration so the next tick triggers completion.
    now = now + 70_000;
    act(() => {
      if (rafCb) rafCb(now);
    });

    expect(playSpy).not.toHaveBeenCalled();
    // Phase should have advanced to short break.
    expect(
      screen.getByLabelText(/current phase: short break/i)
    ).toBeInTheDocument();

    nowSpy.mockRestore();
    rafSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it('plays the chime when not muted on phase completion', async () => {
    const playSpy = vi.fn().mockResolvedValue(undefined);
    const AudioStub = vi.fn().mockImplementation(() => ({play: playSpy, currentTime: 0}));
    vi.stubGlobal('Audio', AudioStub);

    const user = userEvent.setup();
    let now = 1_700_000_000_000;
    const nowSpy = vi.spyOn(Date, 'now').mockImplementation(() => now);
    let rafCb = null;
    const rafSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb) => {
        rafCb = cb;
        return 1;
      });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: '1.0.0',
        data: {
          settings: {
            workMinutes: 1,
            shortBreakMinutes: 5,
            longBreakMinutes: 15,
            longBreakEvery: 4,
            muted: false,
            notifyEnabled: false,
          },
          runtime: {
            phase: 'work',
            status: 'idle',
            startedAt: null,
            accumulatedMs: 0,
            completedWorkSessions: 0,
          },
          history: {},
        },
      })
    );

    render(<PomodoroTimer />);
    await user.click(screen.getByRole('button', {name: /^start$/i}));

    now = now + 70_000;
    act(() => {
      if (rafCb) rafCb(now);
    });

    expect(playSpy).toHaveBeenCalled();

    nowSpy.mockRestore();
    rafSpy.mockRestore();
    vi.unstubAllGlobals();
  });
});

describe('<PomodoroTimer /> — notifications opt-in', () => {
  it('Enable notifications calls Notification.requestPermission and updates UI on grant', async () => {
    const requestSpy = vi.fn().mockResolvedValue('granted');
    function NotificationStub() {}
    NotificationStub.permission = 'default';
    NotificationStub.requestPermission = requestSpy;
    Object.defineProperty(globalThis, 'Notification', {
      value: NotificationStub,
      configurable: true,
      writable: true,
    });

    const user = userEvent.setup();
    render(<PomodoroTimer />);
    const enableBtn = screen.getByRole('button', {
      name: /enable desktop notifications/i,
    });
    await user.click(enableBtn);

    expect(requestSpy).toHaveBeenCalledTimes(1);
    // The "Enable notifications" button is replaced by the inline status note.
    expect(
      screen.queryByRole('button', {name: /enable desktop notifications/i})
    ).not.toBeInTheDocument();
    // Multiple matches expected (toast + inline status).
    expect(
      screen.getAllByText(/desktop notifications enabled\./i).length
    ).toBeGreaterThanOrEqual(1);
  });

  it('does nothing when the Notification API is missing', async () => {
    delete globalThis.Notification;
    const user = userEvent.setup();
    render(<PomodoroTimer />);
    const enableBtn = screen.getByRole('button', {
      name: /enable desktop notifications/i,
    });
    await user.click(enableBtn);
    expect(
      screen.getByText(/notifications are not supported/i)
    ).toBeInTheDocument();
  });
});

describe('<PomodoroTimer /> — persistence', () => {
  it('rehydrates a paused mid-work snapshot from storage', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: '1.0.0',
        data: {
          settings: {
            workMinutes: 25,
            shortBreakMinutes: 5,
            longBreakMinutes: 15,
            longBreakEvery: 4,
            muted: false,
            notifyEnabled: false,
          },
          runtime: {
            phase: 'work',
            status: 'paused',
            startedAt: null,
            accumulatedMs: 5 * 60_000,
            completedWorkSessions: 1,
          },
          history: {'2026-05-04': {completedPomodoros: 2}},
        },
      })
    );
    render(<PomodoroTimer />);
    expect(screen.getByRole('timer')).toHaveTextContent('20:00');
    expect(screen.getByRole('button', {name: /^reset$/i})).toBeEnabled();
  });

  it('persists state after Start with debounced auto-save', async () => {
    vi.useFakeTimers({shouldAdvanceTime: true});
    const user = userEvent.setup({advanceTimers: vi.advanceTimersByTime});
    render(<PomodoroTimer />);
    // wait through the auto-save debounce.
    act(() => {
      fireEvent.click(screen.getByRole('button', {name: /^start$/i}));
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    vi.useRealTimers();

    const persisted = readPersisted();
    expect(persisted).not.toBeNull();
    expect(persisted.version).toBe('1.0.0');
    expect(persisted.data.runtime.status).toBe('running');
    expect(typeof persisted.data.runtime.startedAt).toBe('number');
    // user object retained for later assertions.
    void user;
  });
});
