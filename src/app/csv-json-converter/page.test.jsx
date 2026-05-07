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
import CsvJsonConverter from './page';
// eslint-disable-next-line import/first
import {STORAGE_KEY, STORAGE_VERSION} from './constants';
// eslint-disable-next-line import/first
import {loadFromLocalStorage} from '../../lib/storage';

beforeEach(() => {
  window.localStorage.clear();
});

describe('<CsvJsonConverter />', () => {
  it('renders heading, direction toggle, and input/output cards', () => {
    render(<CsvJsonConverter />);
    expect(
      screen.getByRole('heading', {name: /csv ↔ json converter/i})
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/conversion direction/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/input csv/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/output json/i)).toBeInTheDocument();
  });

  it('converts CSV to JSON live', async () => {
    const user = userEvent.setup();
    render(<CsvJsonConverter />);
    const input = screen.getByLabelText(/input csv/i);
    await user.type(input, 'a,b\n1,2');
    const output = screen.getByLabelText(/output json/i);
    expect(output.value).toContain('"a": 1');
    expect(output.value).toContain('"b": 2');
  });

  it('shows a parser error when JSON → CSV input is invalid', async () => {
    const user = userEvent.setup();
    render(<CsvJsonConverter />);
    // Switch direction to JSON → CSV.
    await user.click(screen.getByRole('radio', {name: /JSON → CSV/i}));
    await user.type(screen.getByLabelText(/input json/i), 'not json');
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('converts JSON to CSV', async () => {
    const user = userEvent.setup();
    render(<CsvJsonConverter />);
    await user.click(screen.getByRole('radio', {name: /JSON → CSV/i}));
    const input = screen.getByLabelText(/input json/i);
    // Use paste to avoid userEvent.type interpreting `[` as a special key.
    input.focus();
    await user.paste('[{"a":1,"b":2}]');
    expect(screen.getByLabelText(/output csv/i).value).toBe('a,b\n1,2');
  });

  it('reports the auto-detected delimiter for CSV input', async () => {
    const user = userEvent.setup();
    render(<CsvJsonConverter />);
    const input = screen.getByLabelText(/input csv/i);
    input.focus();
    await user.paste('a;b\n1;2');
    // Hint area uses role="status".
    const status = screen.getByRole('status');
    expect(status.textContent).toMatch(/semicolon/i);
  });

  it('persists settings (direction + flags) across mounts', async () => {
    const user = userEvent.setup();
    const {unmount} = render(<CsvJsonConverter />);
    await user.click(screen.getByRole('radio', {name: /JSON → CSV/i}));
    await waitFor(() => {
      const {data} = loadFromLocalStorage(STORAGE_KEY, STORAGE_VERSION, () => true);
      expect(data).not.toBeNull();
      expect(data.direction).toBe('json2csv');
    });
    unmount();

    render(<CsvJsonConverter />);
    // After remount, the input label reflects the persisted direction.
    expect(screen.getByLabelText(/input json/i)).toBeInTheDocument();
  });

  it('Clear resets settings and empties input', async () => {
    const user = userEvent.setup();
    render(<CsvJsonConverter />);
    const input = screen.getByLabelText(/input csv/i);
    await user.type(input, 'a,b\n1,2');
    expect(input.value).not.toBe('');
    await user.click(screen.getByRole('button', {name: /^clear$/i}));
    expect(screen.getByLabelText(/input csv/i).value).toBe('');
  });
});
