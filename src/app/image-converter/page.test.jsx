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
import ImageConverter from './page';
// eslint-disable-next-line import/first
import {STORAGE_KEY} from './constants';

beforeEach(() => {
  window.localStorage.clear();
});

describe('<ImageConverter />', () => {
  it('renders heading, format buttons, and the empty state', () => {
    render(<ImageConverter />);
    expect(
      screen.getByRole('heading', {name: /image format converter/i})
    ).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /^png$/i})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /^jpeg$/i})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /^webp$/i})).toBeInTheDocument();
    expect(
      screen.getByText(/drop an image above to convert/i)
    ).toBeInTheDocument();
  });

  it('PNG target hides the quality slider; JPEG shows it', async () => {
    const user = userEvent.setup();
    render(<ImageConverter />);
    // Default is PNG → quality slider hidden.
    expect(screen.queryByLabelText(/^quality$/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(/png is lossless/i)
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', {name: /^jpeg$/i}));
    expect(screen.getByLabelText(/^quality$/i)).toBeInTheDocument();
  });

  it('persists target + quality settings', async () => {
    const user = userEvent.setup();
    render(<ImageConverter />);
    await user.click(screen.getByRole('button', {name: /^webp$/i}));

    // Wait for the autosave debounce.
    await new Promise((r) => setTimeout(r, 400));
    const stored = window.localStorage.getItem(STORAGE_KEY);
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored);
    expect(parsed.data.target).toBe('image/webp');
  });
});
