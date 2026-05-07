import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
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
import RegexTester from './page';
// eslint-disable-next-line import/first
import {STORAGE_KEY} from './constants';

beforeEach(() => {
  window.localStorage.clear();
});

describe('<RegexTester />', () => {
  it('renders heading, pattern input, and flag toggles', () => {
    render(<RegexTester />);
    expect(
      screen.getByRole('heading', {name: /regex tester/i})
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/regex pattern/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/test text/i)).toBeInTheDocument();
    // Default `g` flag is active (label includes 'global').
    expect(screen.getByLabelText(/global \(find all\)/i)).toBeChecked();
  });

  it('shows match count and highlights matches', async () => {
    const user = userEvent.setup();
    render(<RegexTester />);
    await user.type(screen.getByLabelText(/regex pattern/i), 'a');
    await user.type(
      screen.getByLabelText(/test text/i),
      'banana'
    );
    // 3 matches (banana has 3 'a' letters with global flag).
    expect(screen.getByText(/^3 matches$/i)).toBeInTheDocument();
  });

  it('shows the engine error for an invalid pattern', async () => {
    const user = userEvent.setup();
    render(<RegexTester />);
    await user.type(screen.getByLabelText(/regex pattern/i), '(');
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('toggling the i flag is case-insensitive matching', async () => {
    const user = userEvent.setup();
    render(<RegexTester />);
    await user.type(screen.getByLabelText(/regex pattern/i), 'A');
    await user.type(screen.getByLabelText(/test text/i), 'aA');
    // With g-only, only 'A' matches → 1.
    expect(screen.getByText(/^1 match$/i)).toBeInTheDocument();
    await user.click(screen.getByLabelText(/case-insensitive/i));
    // With i added, both 'a' and 'A' match → 2.
    expect(screen.getByText(/^2 matches$/i)).toBeInTheDocument();
  });

  it('preset chips populate pattern + flags', async () => {
    const user = userEvent.setup();
    render(<RegexTester />);
    await user.click(screen.getByRole('button', {name: /^email$/i}));
    expect(screen.getByLabelText(/regex pattern/i)).toHaveValue(
      '[\\w.+-]+@[\\w-]+\\.[\\w.-]+'
    );
  });

  it('Clear wipes pattern, flags, test, and storage', async () => {
    const user = userEvent.setup();
    render(<RegexTester />);
    await user.type(screen.getByLabelText(/regex pattern/i), 'foo');
    await user.type(screen.getByLabelText(/test text/i), 'foobar');
    await user.click(screen.getByRole('button', {name: /^clear$/i}));
    expect(screen.getByLabelText(/regex pattern/i)).toHaveValue('');
    expect(screen.getByLabelText(/test text/i)).toHaveValue('');
  });

  it('persists pattern, flags, test', async () => {
    const user = userEvent.setup();
    const {unmount} = render(<RegexTester />);
    await user.type(screen.getByLabelText(/regex pattern/i), 'foo');
    await new Promise((r) => setTimeout(r, 400));
    const stored = window.localStorage.getItem(STORAGE_KEY);
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored).data.pattern).toBe('foo');
    unmount();

    render(<RegexTester />);
    expect(screen.getByLabelText(/regex pattern/i)).toHaveValue('foo');
  });
});
