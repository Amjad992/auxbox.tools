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
    // S4: match count appears after debounce settles.
    // 3 matches (banana has 3 'a' letters with global flag).
    // Use getAllByText because the sr-only status span also contains this text.
    await waitFor(() =>
      expect(screen.getAllByText(/^3 matches$/i).length).toBeGreaterThanOrEqual(1)
    );
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
    // Use getAllByText because the sr-only status span also contains this text.
    await waitFor(() =>
      expect(screen.getAllByText(/^1 match$/i).length).toBeGreaterThanOrEqual(1)
    );
    await user.click(screen.getByLabelText(/case-insensitive/i));
    // With i added, both 'a' and 'A' match → 2.
    await waitFor(() =>
      expect(screen.getAllByText(/^2 matches$/i).length).toBeGreaterThanOrEqual(1)
    );
  });

  // S8: preset must populate both pattern AND flags; URL preset uses 'gi'.
  it('preset chips populate pattern + flags (replaces current flags)', async () => {
    const user = userEvent.setup();
    render(<RegexTester />);
    // Default flag is 'g'. URL preset has 'gi'.
    await user.click(screen.getByRole('button', {name: /^url$/i}));
    expect(screen.getByLabelText(/regex pattern/i)).toHaveValue(
      'https?:\\/\\/[\\w\\-._~:/?#\\[\\]@!$&\'()*+,;=%]+'
    );
    // Both g and i should now be checked.
    expect(screen.getByLabelText(/global \(find all\)/i)).toBeChecked();
    expect(screen.getByLabelText(/case-insensitive/i)).toBeChecked();
  });

  // S10: name matches the assertions; also verifies flags reset.
  it('Clear wipes pattern, test, and flags', async () => {
    const user = userEvent.setup();
    render(<RegexTester />);
    await user.type(screen.getByLabelText(/regex pattern/i), 'foo');
    await user.type(screen.getByLabelText(/test text/i), 'foobar');
    // Toggle case-insensitive so it is non-default.
    await user.click(screen.getByLabelText(/case-insensitive/i));
    await user.click(screen.getByRole('button', {name: /^clear$/i}));
    expect(screen.getByLabelText(/regex pattern/i)).toHaveValue('');
    expect(screen.getByLabelText(/test text/i)).toHaveValue('');
    // Flags should reset to default ('g' on, 'i' off).
    expect(screen.getByLabelText(/global \(find all\)/i)).toBeChecked();
    expect(screen.getByLabelText(/case-insensitive/i)).not.toBeChecked();
  });

  // S6 + S10: use waitFor instead of wall-clock setTimeout; assert flags + test in storage.
  it('persists pattern, flags, and test text to storage and rehydrates', async () => {
    const user = userEvent.setup();
    const {unmount} = render(<RegexTester />);
    await user.type(screen.getByLabelText(/regex pattern/i), 'foo');
    await user.type(screen.getByLabelText(/test text/i), 'foobar');
    // Toggle case-insensitive so flags differ from default.
    await user.click(screen.getByLabelText(/case-insensitive/i));

    // S6: poll until autosave fires rather than using a fixed timeout.
    await waitFor(() => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeTruthy();
    });

    const stored = window.localStorage.getItem(STORAGE_KEY);
    const data = JSON.parse(stored).data;
    expect(data.pattern).toBe('foo');
    expect(data.test).toBe('foobar');
    // 'gi' because default 'g' plus toggled 'i'.
    expect(data.flags).toContain('i');

    unmount();

    // Rehydration: all three values should be restored.
    render(<RegexTester />);
    expect(screen.getByLabelText(/regex pattern/i)).toHaveValue('foo');
    expect(screen.getByLabelText(/test text/i)).toHaveValue('foobar');
    expect(screen.getByLabelText(/case-insensitive/i)).toBeChecked();
  });
});
