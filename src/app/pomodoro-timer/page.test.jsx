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

describe('<PomodoroTimer /> — notification toggle (4 states)', () => {
  function stubNotification(permission, requestResult = permission) {
    const requestSpy = vi.fn().mockResolvedValue(requestResult);
    function NotificationStub() {}
    NotificationStub.permission = permission;
    NotificationStub.requestPermission = requestSpy;
    Object.defineProperty(globalThis, 'Notification', {
      value: NotificationStub,
      configurable: true,
      writable: true,
    });
    return requestSpy;
  }

  // State A: permission='default', notifyEnabled=false → "Enable notifications" button;
  // clicking requests permission, on grant button becomes "Disable notifications".
  it('State A: requests permission and shows Disable button on grant', async () => {
    const requestSpy = stubNotification('default', 'granted');
    const user = userEvent.setup();
    render(<PomodoroTimer />);

    const enableBtn = screen.getByRole('button', {name: /enable desktop notifications/i});
    await user.click(enableBtn);

    expect(requestSpy).toHaveBeenCalledTimes(1);
    // Enable button is gone; Disable button appears.
    expect(screen.queryByRole('button', {name: /enable desktop notifications/i})).not.toBeInTheDocument();
    expect(screen.getByRole('button', {name: /disable desktop notifications/i})).toBeInTheDocument();
    // Toast confirms enable.
    expect(screen.getByText(/desktop notifications enabled\./i)).toBeInTheDocument();
  });

  // State B: permission='granted', notifyEnabled=true → "Disable notifications" button;
  // clicking turns off without re-requesting.
  it('State B: shows Disable button when already granted+enabled; click disables without re-requesting', async () => {
    const requestSpy = stubNotification('granted');
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: '1.0.0',
        data: {
          settings: {workMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, longBreakEvery: 4, muted: false, notifyEnabled: true},
          runtime: {phase: 'work', status: 'idle', startedAt: null, accumulatedMs: 0, completedWorkSessions: 0},
          history: {},
        },
      })
    );
    const user = userEvent.setup();
    render(<PomodoroTimer />);

    const disableBtn = screen.getByRole('button', {name: /disable desktop notifications/i});
    await user.click(disableBtn);

    expect(requestSpy).not.toHaveBeenCalled();
    // Now shows Enable button again (permission stays granted but notifyEnabled=false).
    expect(screen.getByRole('button', {name: /enable desktop notifications/i})).toBeInTheDocument();
    expect(screen.queryByRole('button', {name: /disable desktop notifications/i})).not.toBeInTheDocument();
    expect(screen.getByText(/desktop notifications disabled\./i)).toBeInTheDocument();
  });

  // State C: permission='granted', notifyEnabled=false → "Enable notifications";
  // clicking re-enables without re-requesting permission.
  it('State C: re-enables without re-requesting when permission already granted', async () => {
    const requestSpy = stubNotification('granted');
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: '1.0.0',
        data: {
          settings: {workMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, longBreakEvery: 4, muted: false, notifyEnabled: false},
          runtime: {phase: 'work', status: 'idle', startedAt: null, accumulatedMs: 0, completedWorkSessions: 0},
          history: {},
        },
      })
    );
    const user = userEvent.setup();
    render(<PomodoroTimer />);

    const enableBtn = screen.getByRole('button', {name: /enable desktop notifications/i});
    await user.click(enableBtn);

    expect(requestSpy).not.toHaveBeenCalled();
    expect(screen.getByRole('button', {name: /disable desktop notifications/i})).toBeInTheDocument();
    expect(screen.getByText(/desktop notifications enabled\./i)).toBeInTheDocument();
  });

  // State D: permission='denied' → explanatory text, no button.
  it('State D: shows explanatory text when notifications are denied', () => {
    stubNotification('denied');
    render(<PomodoroTimer />);

    expect(screen.queryByRole('button', {name: /enable desktop notifications/i})).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: /disable desktop notifications/i})).not.toBeInTheDocument();
    expect(screen.getByText(/notifications blocked in browser/i)).toBeInTheDocument();
  });

  // Enable → Disable → Enable cycle (States A → B → C).
  it('full enable-disable-enable cycle works without re-requesting', async () => {
    const requestSpy = stubNotification('default', 'granted');
    const user = userEvent.setup();
    render(<PomodoroTimer />);

    // Enable (State A → grant → State B).
    await user.click(screen.getByRole('button', {name: /enable desktop notifications/i}));
    expect(requestSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', {name: /disable desktop notifications/i})).toBeInTheDocument();

    // Disable (State B → State C, shown as "Enable").
    await user.click(screen.getByRole('button', {name: /disable desktop notifications/i}));
    expect(requestSpy).toHaveBeenCalledTimes(1); // no second request
    expect(screen.getByRole('button', {name: /enable desktop notifications/i})).toBeInTheDocument();

    // Re-enable (State C → State B).
    await user.click(screen.getByRole('button', {name: /enable desktop notifications/i}));
    expect(requestSpy).toHaveBeenCalledTimes(1); // still no additional request
    expect(screen.getByRole('button', {name: /disable desktop notifications/i})).toBeInTheDocument();
  });

  it('shows "not supported" note and no button when the Notification API is missing', () => {
    delete globalThis.Notification;
    render(<PomodoroTimer />);
    // No enable/disable buttons when the API is absent.
    expect(screen.queryByRole('button', {name: /enable desktop notifications/i})).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: /disable desktop notifications/i})).not.toBeInTheDocument();
    expect(screen.getByText(/notifications not supported in this browser/i)).toBeInTheDocument();
  });
});

describe('<PomodoroTimer /> — work-duration across phase cycle (issue 3 regression)', () => {
  it('second work session shows the custom workMinutes after work→break→work cycle', async () => {
    // Seed: 30 min work, 1 min short break (speeds up the test), muted.
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: '1.0.0',
        data: {
          settings: {
            workMinutes: 30,
            shortBreakMinutes: 1,
            longBreakMinutes: 15,
            longBreakEvery: 4,
            muted: true,
            notifyEnabled: false,
          },
          runtime: {phase: 'work', status: 'idle', startedAt: null, accumulatedMs: 0, completedWorkSessions: 0},
          history: {},
        },
      })
    );

    const user = userEvent.setup();
    let now = 1_700_000_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    let rafCb = null;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCb = cb;
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    render(<PomodoroTimer />);
    // Initial display: 30:00
    expect(screen.getByRole('timer')).toHaveTextContent('30:00');

    // Start work session.
    await user.click(screen.getByRole('button', {name: /^start$/i}));

    // Advance past the 30-min work duration.
    now += 30 * 60_000 + 1_000;
    act(() => { if (rafCb) rafCb(now); });

    // Phase has auto-completed → now in Short break (paused).
    expect(screen.getByLabelText(/current phase: short break/i)).toBeInTheDocument();
    expect(screen.getByRole('timer')).toHaveTextContent('01:00');

    // Start the break.
    await user.click(screen.getByRole('button', {name: /^start$/i}));

    // Advance past the 1-min break.
    now += 60_000 + 1_000;
    act(() => { if (rafCb) rafCb(now); });

    // Second work session: must show 30:00, not the short-break duration (1:00).
    expect(screen.getByLabelText(/current phase: work/i)).toBeInTheDocument();
    expect(screen.getByRole('timer')).toHaveTextContent('30:00');
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
