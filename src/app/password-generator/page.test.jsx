import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Stub next/script — it expects the App Router runtime which jsdom doesn't provide.
vi.mock('next/script', () => ({
  default: ({children, dangerouslySetInnerHTML}) =>
    dangerouslySetInnerHTML
      ? <script dangerouslySetInnerHTML={dangerouslySetInnerHTML} />
      : <script>{children}</script>,
}));

// Mock copyToClipboard so we can assert what was sent without fighting
// jsdom over navigator.clipboard descriptor flags.
const copyToClipboard = vi.fn().mockResolvedValue(true);
vi.mock('./hooks', async () => {
  const actual = await vi.importActual('./hooks');
  return {...actual, copyToClipboard: (...args) => copyToClipboard(...args)};
});

// eslint-disable-next-line import/first
import PasswordGenerator from './page';

beforeEach(() => {
  copyToClipboard.mockClear();
  copyToClipboard.mockResolvedValue(true);
});

describe('<PasswordGenerator /> (page)', () => {
  it('renders the hero, controls, and an empty result', () => {
    render(<PasswordGenerator />);
    expect(
      screen.getByRole('heading', {name: /password generator/i})
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/generated password/i)).toHaveValue('');
    // Default length is 16.
    expect(screen.getByText('16')).toBeInTheDocument();
    // The default-class checkboxes.
    expect(screen.getByLabelText(/uppercase/i)).toBeChecked();
    expect(screen.getByLabelText(/lowercase/i)).toBeChecked();
    expect(screen.getByLabelText(/digits/i)).toBeChecked();
    expect(screen.getByLabelText(/^symbols/i)).not.toBeChecked();
  });

  it('Generate fills the result with a non-empty password', async () => {
    const user = userEvent.setup();
    render(<PasswordGenerator />);
    await user.click(screen.getByRole('button', {name: /^generate/i}));
    const out = screen.getByLabelText(/generated password/i);
    expect(out.value.length).toBe(16);
  });

  it('Copy invokes navigator.clipboard.writeText with the current password', async () => {
    const user = userEvent.setup();
    render(<PasswordGenerator />);
    await user.click(screen.getByRole('button', {name: /^generate/i}));
    const pw = screen.getByLabelText(/generated password/i).value;
    await user.click(screen.getByRole('button', {name: /copy password/i}));
    expect(copyToClipboard).toHaveBeenCalledWith(pw);
  });

  it('Copy is disabled before any password has been generated', () => {
    render(<PasswordGenerator />);
    expect(screen.getByRole('button', {name: /copy password/i})).toBeDisabled();
  });

  it('shows a warning when every class is unchecked', async () => {
    const user = userEvent.setup();
    render(<PasswordGenerator />);
    await user.click(screen.getByLabelText(/uppercase/i));
    await user.click(screen.getByLabelText(/lowercase/i));
    await user.click(screen.getByLabelText(/digits/i));
    expect(screen.getByRole('alert')).toHaveTextContent(
      /select at least one character class/i
    );
  });
});
