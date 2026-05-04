import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {DateTime} from 'luxon';
import DatePicker from './DatePicker';

// react-day-picker uses CSS imports; stub style.css so jsdom doesn't choke.
vi.mock('react-day-picker/style.css', () => ({}));

const noop = () => {};

describe('<DatePicker /> — rendering', () => {
  it('renders label and empty input when value is null', () => {
    render(<DatePicker label="Start date" value={null} onChange={noop} />);
    expect(screen.getByLabelText('Start date')).toBeInTheDocument();
    expect(screen.getByLabelText('Start date').value).toBe('');
  });

  it('renders the formatted date when value is a DateTime', () => {
    const dt = DateTime.fromISO('2024-06-15');
    render(<DatePicker label="Start date" value={dt} onChange={noop} />);
    expect(screen.getByLabelText('Start date').value).toBe('2024-06-15');
  });

  it('renders a calendar toggle button', () => {
    render(<DatePicker label="Start date" value={null} onChange={noop} />);
    expect(screen.getByRole('button', {name: /open calendar/i})).toBeInTheDocument();
  });
});

describe('<DatePicker /> — text input parsing', () => {
  it('fires onChange with DateTime on blur after valid YYYY-MM-DD', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DatePicker label="Start date" value={null} onChange={onChange} />);
    const input = screen.getByLabelText('Start date');
    await user.type(input, '2024-06-15');
    await user.tab();
    expect(onChange).toHaveBeenCalledOnce();
    const arg = onChange.mock.calls[0][0];
    expect(arg).not.toBeNull();
    expect(arg.toISODate()).toBe('2024-06-15');
  });

  it('fires onChange(null) on blur after invalid string', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DatePicker label="Start date" value={null} onChange={onChange} />);
    const input = screen.getByLabelText('Start date');
    await user.type(input, 'not-a-date');
    await user.tab();
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('fires onChange(null) on blur of empty input', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const dt = DateTime.fromISO('2024-06-15');
    render(<DatePicker label="Start date" value={dt} onChange={onChange} />);
    const input = screen.getByLabelText('Start date');
    await user.clear(input);
    await user.tab();
    expect(onChange).toHaveBeenCalledWith(null);
  });
});

describe('<DatePicker /> — calendar popup', () => {
  it('opens the picker when the toggle button is clicked', async () => {
    const user = userEvent.setup();
    render(<DatePicker label="Start date" value={null} onChange={noop} />);
    await user.click(screen.getByRole('button', {name: /open calendar/i}));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes the picker on Escape', async () => {
    const user = userEvent.setup();
    render(<DatePicker label="Start date" value={null} onChange={noop} />);
    await user.click(screen.getByRole('button', {name: /open calendar/i}));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('closes the picker when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <DatePicker label="Start date" value={null} onChange={noop} />
        <button>outside</button>
      </div>
    );
    await user.click(screen.getByRole('button', {name: /open calendar/i}));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: /outside/i}));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});

describe('<DatePicker /> — disabled state', () => {
  it('disables the text input when disabled=true', () => {
    render(<DatePicker label="Start date" value={null} onChange={noop} disabled />);
    expect(screen.getByLabelText('Start date')).toBeDisabled();
  });

  it('disables the calendar button when disabled=true', () => {
    render(<DatePicker label="Start date" value={null} onChange={noop} disabled />);
    expect(screen.getByRole('button', {name: /open calendar/i})).toBeDisabled();
  });
});

describe('<DatePicker /> — value sync', () => {
  it('updates the text input when value prop changes externally', () => {
    const {rerender} = render(
      <DatePicker label="Start date" value={null} onChange={noop} />
    );
    expect(screen.getByLabelText('Start date').value).toBe('');

    const dt = DateTime.fromISO('2025-03-20');
    rerender(<DatePicker label="Start date" value={dt} onChange={noop} />);
    expect(screen.getByLabelText('Start date').value).toBe('2025-03-20');
  });
});
