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

  it('Copy invokes copyToClipboard with the current password', async () => {
    const user = userEvent.setup();
    render(<PasswordGenerator />);
    await user.click(screen.getByRole('button', {name: /^generate/i}));
    const pw = screen.getByLabelText(/generated password/i).value;
    await user.click(screen.getByRole('button', {name: /^copy$/i}));
    expect(copyToClipboard).toHaveBeenCalledWith(pw);
  });

  it('Copy is disabled before any password has been generated', () => {
    render(<PasswordGenerator />);
    expect(screen.getByRole('button', {name: /^copy$/i})).toBeDisabled();
  });

  it('does not allow unchecking the last enabled class (MAJ-3 prevention)', async () => {
    // The UI prevents reaching the all-off state: the last enabled class
    // checkbox is disabled, so the warning/alert is unreachable through
    // normal interaction.
    const user = userEvent.setup();
    render(<PasswordGenerator />);
    // Uncheck upper and lower — digits is now the only enabled class.
    await user.click(screen.getByLabelText(/uppercase/i));
    await user.click(screen.getByLabelText(/lowercase/i));
    // Digits is now the last enabled class — its checkbox must be disabled.
    expect(screen.getByLabelText(/digits/i)).toBeDisabled();
    // Generate stays enabled because hasAnyClass is still true.
    expect(screen.getByRole('button', {name: /^generate/i})).not.toBeDisabled();
    // No warning alert — the all-off state was never reached.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('last enabled class checkbox is disabled to prevent all-off state', async () => {
    const user = userEvent.setup();
    render(<PasswordGenerator />);
    // Default has upper, lower, digits enabled. Uncheck two.
    await user.click(screen.getByLabelText(/uppercase/i));
    await user.click(screen.getByLabelText(/lowercase/i));
    // Only digits remains — its checkbox should be disabled.
    expect(screen.getByLabelText(/digits/i)).toBeDisabled();
    // Unchecking it is blocked, so re-checking upper is fine.
    await user.click(screen.getByLabelText(/uppercase/i));
    expect(screen.getByLabelText(/digits/i)).not.toBeDisabled();
  });
});
