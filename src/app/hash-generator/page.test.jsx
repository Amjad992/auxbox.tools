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
import HashGenerator from './page';
// eslint-disable-next-line import/first
import {STORAGE_KEY} from './constants';

const ABC_SHA256 =
  'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';

beforeEach(() => {
  window.localStorage.clear();
});

describe('<HashGenerator />', () => {
  it('renders title, mode toggle, textarea (default mode), and the empty state', () => {
    render(<HashGenerator />);
    expect(
      screen.getByRole('heading', {name: /hash generator/i})
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radiogroup', {name: /hash mode/i})
    ).toBeInTheDocument();
    expect(screen.getByRole('radio', {name: /text/i})).toBeChecked();
    expect(screen.getByLabelText(/text to hash/i)).toBeInTheDocument();
    expect(
      screen.getByText(/enter text above to compute hashes/i)
    ).toBeInTheDocument();
  });

  it('typing text computes the canonical SHA-256 of "abc"', async () => {
    const user = userEvent.setup();
    render(<HashGenerator />);
    await user.type(screen.getByLabelText(/text to hash/i), 'abc');
    await waitFor(() => {
      expect(screen.getByText(ABC_SHA256)).toBeInTheDocument();
    });
  });

  it('all four algorithm rows render', async () => {
    const user = userEvent.setup();
    render(<HashGenerator />);
    await user.type(screen.getByLabelText(/text to hash/i), 'abc');
    await waitFor(() => {
      expect(screen.getByText(ABC_SHA256)).toBeInTheDocument();
    });
    expect(screen.getByText(/^SHA-256$/)).toBeInTheDocument();
    expect(screen.getByText(/^SHA-512$/)).toBeInTheDocument();
    expect(screen.getByText(/^SHA-1$/)).toBeInTheDocument();
    expect(screen.getByText(/^MD5$/)).toBeInTheDocument();
  });

  it('mode toggle to File renders the dropzone', async () => {
    const user = userEvent.setup();
    render(<HashGenerator />);
    await user.click(screen.getByRole('radio', {name: /file/i}));
    expect(
      screen.getByText(/drop a file or click to pick one/i)
    ).toBeInTheDocument();
    // Textarea is no longer rendered.
    expect(screen.queryByLabelText(/text to hash/i)).not.toBeInTheDocument();
  });

  it('switching modes clears the previous input', async () => {
    const user = userEvent.setup();
    render(<HashGenerator />);
    await user.type(screen.getByLabelText(/text to hash/i), 'abc');
    await waitFor(() => {
      expect(screen.getByText(ABC_SHA256)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('radio', {name: /file/i}));
    // SHA-256 of "abc" is gone.
    expect(screen.queryByText(ABC_SHA256)).not.toBeInTheDocument();
    // Empty-file message is shown.
    expect(
      screen.getByText(/drop or pick a file above to compute hashes/i)
    ).toBeInTheDocument();

    // Going back to text shows the empty-text message (typed text was cleared).
    await user.click(screen.getByRole('radio', {name: /text/i}));
    expect(
      screen.getByText(/enter text above to compute hashes/i)
    ).toBeInTheDocument();
  });

  it('Clear wipes input and result', async () => {
    const user = userEvent.setup();
    render(<HashGenerator />);
    await user.type(screen.getByLabelText(/text to hash/i), 'abc');
    await waitFor(() => {
      expect(screen.getByText(ABC_SHA256)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', {name: /^clear$/i}));
    expect(screen.queryByText(ABC_SHA256)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/text to hash/i)).toHaveValue('');
  });

  it('mode preference persists across remounts (input does NOT)', async () => {
    const user = userEvent.setup();
    const {unmount} = render(<HashGenerator />);
    await user.type(screen.getByLabelText(/text to hash/i), 'abc');
    await waitFor(() => {
      expect(screen.getByText(ABC_SHA256)).toBeInTheDocument();
    });
    await user.click(screen.getByRole('radio', {name: /file/i}));

    // Wait for the autosave debounce.
    await waitFor(() => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeTruthy();
      // Confirm the persisted state is *exactly* {mode: 'file'} — any
      // additional key would be a privacy leak (input bytes, etc).
      const parsed = JSON.parse(stored);
      expect(Object.keys(parsed.data).sort()).toEqual(['mode']);
      expect(parsed.data.mode).toBe('file');
    });
    unmount();

    render(<HashGenerator />);
    // Mode is restored.
    expect(screen.getByRole('radio', {name: /file/i})).toBeChecked();
    // Input is NOT — privacy guarantee.
    expect(screen.queryByText(ABC_SHA256)).not.toBeInTheDocument();
  });
});
