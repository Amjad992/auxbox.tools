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
import ContrastChecker from './page';
// eslint-disable-next-line import/first
import {STORAGE_KEY} from './constants';

beforeEach(() => {
  window.localStorage.clear();
});

describe('<ContrastChecker />', () => {
  it('renders heading, both color inputs, and the four WCAG grade rows', () => {
    render(<ContrastChecker />);
    expect(
      screen.getByRole('heading', {name: /color contrast checker/i})
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^foreground$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^background$/i)).toBeInTheDocument();

    expect(screen.getAllByText(/AA · normal text/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/AA · large text/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/AAA · normal text/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/AAA · large text/i).length).toBeGreaterThan(0);
  });

  it('default colors (#1a1a1a on #ffffff) score AAA Pass on all four rows', () => {
    render(<ContrastChecker />);
    // Black-ish on white is well over 7:1.
    const passes = screen.getAllByText(/Pass/i);
    expect(passes.length).toBeGreaterThanOrEqual(4);
  });

  it('typing a hex updates the ratio reading', async () => {
    const user = userEvent.setup();
    render(<ContrastChecker />);
    const fg = screen.getByLabelText(/^foreground$/i);
    await user.clear(fg);
    await user.type(fg, '#ffffff');
    // White on white → 1.00:1
    expect(screen.getByText(/^1\.00$/)).toBeInTheDocument();
  });

  it('Swap exchanges fg and bg', async () => {
    const user = userEvent.setup();
    render(<ContrastChecker />);
    const fg = screen.getByLabelText(/^foreground$/i);
    const bg = screen.getByLabelText(/^background$/i);
    expect(fg.value).toBe('#1a1a1a');
    expect(bg.value).toBe('#ffffff');
    await user.click(screen.getByRole('button', {name: /^↕ swap$/i}));
    expect(fg.value).toBe('#ffffff');
    expect(bg.value).toBe('#1a1a1a');
  });

  it('shows error styling on unparseable color text', async () => {
    const user = userEvent.setup();
    render(<ContrastChecker />);
    const fg = screen.getByLabelText(/^foreground$/i);
    await user.clear(fg);
    await user.type(fg, 'not-a-color');
    expect(fg).toHaveClass('cc-color-input--error');
  });

  it('persists fg + bg', async () => {
    const user = userEvent.setup();
    const {unmount} = render(<ContrastChecker />);
    const fg = screen.getByLabelText(/^foreground$/i);
    await user.clear(fg);
    await user.type(fg, '#ff0000');
    await new Promise((r) => setTimeout(r, 400));
    const stored = window.localStorage.getItem(STORAGE_KEY);
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored).data.fg).toBe('#ff0000');
    unmount();

    render(<ContrastChecker />);
    expect(screen.getByLabelText(/^foreground$/i)).toHaveValue('#ff0000');
  });
});
