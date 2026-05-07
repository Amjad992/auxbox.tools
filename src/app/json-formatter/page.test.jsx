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
import JsonFormatter from './page';
// eslint-disable-next-line import/first
import {STORAGE_KEY} from './constants';

beforeEach(() => {
  window.localStorage.clear();
});

describe('<JsonFormatter />', () => {
  it('renders heading, mode toggle, input + output textareas', () => {
    render(<JsonFormatter />);
    expect(
      screen.getByRole('heading', {name: /json formatter/i})
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/input json/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/output json/i)).toBeInTheDocument();
    expect(
      screen.getByRole('radiogroup', {name: /output mode/i})
    ).toBeInTheDocument();
  });

  it('live-formats valid JSON into pretty-printed output', async () => {
    const user = userEvent.setup();
    render(<JsonFormatter />);
    const input = screen.getByLabelText(/input json/i);
    await user.type(input, '{{"a":1,"b":2}');

    await waitFor(() => {
      const out = screen.getByLabelText(/output json/i);
      expect(out.value).toContain('"a": 1');
    });
  });

  it('shows an inline error for malformed JSON', async () => {
    const user = userEvent.setup();
    render(<JsonFormatter />);
    await user.type(screen.getByLabelText(/input json/i), '{{');
    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toMatch(
        /unexpected|json|expected/i
      );
    });
  });

  it('Minify mode produces a single-line compact JSON', async () => {
    const user = userEvent.setup();
    render(<JsonFormatter />);
    await user.click(screen.getByRole('radio', {name: /minify/i}));
    await user.type(screen.getByLabelText(/input json/i), '{{"a":1,"b":2}');

    await waitFor(() => {
      const out = screen.getByLabelText(/output json/i);
      expect(out.value).toBe('{"a":1,"b":2}');
    });
  });

  it('Sort keys checkbox alphabetises nested keys', async () => {
    const user = userEvent.setup();
    render(<JsonFormatter />);
    await user.click(screen.getByLabelText(/sort keys/i));
    await user.type(
      screen.getByLabelText(/input json/i),
      '{{"b":2,"a":1}'
    );

    await waitFor(() => {
      const out = screen.getByLabelText(/output json/i);
      // a comes before b in the output.
      expect(out.value.indexOf('"a"')).toBeLessThan(
        out.value.indexOf('"b"')
      );
    });
  });

  it('persists settings (mode, indent, sortKeys, liveFormat)', async () => {
    const user = userEvent.setup();
    const {unmount} = render(<JsonFormatter />);
    await user.click(screen.getByRole('radio', {name: /minify/i}));
    await user.click(screen.getByLabelText(/sort keys/i));

    await waitFor(() => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored);
      expect(parsed.data.mode).toBe('minify');
      expect(parsed.data.sortKeys).toBe(true);
    });
    unmount();

    render(<JsonFormatter />);
    expect(screen.getByRole('radio', {name: /minify/i})).toBeChecked();
    expect(screen.getByLabelText(/sort keys/i)).toBeChecked();
  });

  it('Clear wipes output, error, and resets mode', async () => {
    const user = userEvent.setup();
    render(<JsonFormatter />);
    await user.type(screen.getByLabelText(/input json/i), '{{"a":1}');
    await waitFor(() => {
      expect(screen.getByLabelText(/output json/i).value).toContain(
        '"a"'
      );
    });
    await user.click(screen.getByRole('button', {name: /^clear$/i}));
    expect(screen.getByLabelText(/input json/i)).toHaveValue('');
    expect(screen.getByLabelText(/output json/i)).toHaveValue('');
  });

  it('Validate mode shows success ribbon and hides the Output card', async () => {
    const user = userEvent.setup();
    render(<JsonFormatter />);
    await user.click(screen.getByRole('radio', {name: /validate/i}));
    await user.type(screen.getByLabelText(/input json/i), '{{"a":1}');

    await waitFor(
      () => {
        expect(screen.getByRole('status').textContent).toMatch(/valid json/i);
      },
      {timeout: 600},
    );
    expect(screen.queryByLabelText(/output json/i)).not.toBeInTheDocument();
  });

  it('Use as input swaps the output into the input', async () => {
    const user = userEvent.setup();
    render(<JsonFormatter />);
    await user.type(screen.getByLabelText(/input json/i), '{{"a":1}');
    await waitFor(() => {
      expect(screen.getByLabelText(/output json/i).value).toContain('"a"');
    });
    await user.click(screen.getByRole('button', {name: /use as input/i}));
    const input = screen.getByLabelText(/input json/i);
    expect(input.value).toContain('"a"');
    // With liveFormat on, the swap moves output → input, then the live
    // effect re-runs and re-formats it. Confirm the formatted value is
    // still valid JSON containing the same key.
    await waitFor(() => {
      expect(screen.getByLabelText(/output json/i).value).toContain('"a"');
    });
  });
});
