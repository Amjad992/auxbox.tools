import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ColorPicker from './ColorPicker';

describe('<ColorPicker />', () => {
  const defaultProps = {
    value: '#ff0000',
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the swatch trigger button', () => {
    render(<ColorPicker {...defaultProps} />);
    const btn = screen.getByRole('button', { name: /pick color/i });
    expect(btn).toBeInTheDocument();
  });

  it('opens the popover on click', async () => {
    render(<ColorPicker {...defaultProps} />);
    const btn = screen.getByRole('button', { name: /pick color/i });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.click(btn);
    expect(screen.getByRole('dialog', { name: /color picker/i })).toBeInTheDocument();
  });

  it('closes the popover on a second click (toggle)', async () => {
    render(<ColorPicker {...defaultProps} />);
    const btn = screen.getByRole('button', { name: /pick color/i });
    await userEvent.click(btn);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await userEvent.click(btn);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on Escape key', async () => {
    render(<ColorPicker {...defaultProps} />);
    const btn = screen.getByRole('button', { name: /pick color/i });
    await userEvent.click(btn);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on outside click', async () => {
    render(
      <div>
        <ColorPicker {...defaultProps} />
        <button>Outside</button>
      </div>
    );
    const btn = screen.getByRole('button', { name: /pick color/i });
    await userEvent.click(btn);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // Click outside the popover
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Outside' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the hex input with the current color value when opened', async () => {
    render(<ColorPicker value="#1abc9c" onChange={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /pick color/i }));
    const hexInput = screen.getByLabelText(/hex color value/i);
    expect(hexInput).toBeInTheDocument();
    expect(hexInput.value).toBe('#1abc9c');
  });

  it('calls onChange with hex when hex input changes to a valid value', async () => {
    const onChange = vi.fn();
    render(<ColorPicker value="#ff0000" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /pick color/i }));
    const hexInput = screen.getByLabelText(/hex color value/i);
    // Clear and type a new valid hex
    await userEvent.clear(hexInput);
    await userEvent.type(hexInput, '#0000ff');
    // onChange should have been called with a hex from the valid intermediate values
    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('updates the internal hex when value prop changes', async () => {
    const { rerender } = render(<ColorPicker value="#ff0000" onChange={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /pick color/i }));
    let hexInput = screen.getByLabelText(/hex color value/i);
    expect(hexInput.value).toBe('#ff0000');
    rerender(<ColorPicker value="#00ff00" onChange={vi.fn()} />);
    hexInput = screen.getByLabelText(/hex color value/i);
    expect(hexInput.value).toBe('#00ff00');
  });

  it('does not call onChange for invalid hex input', async () => {
    const onChange = vi.fn();
    render(<ColorPicker value="#ff0000" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /pick color/i }));
    const hexInput = screen.getByLabelText(/hex color value/i);
    await userEvent.clear(hexInput);
    await userEvent.type(hexInput, '#xyz');
    // onChange calls before clearing will have been made (from clearing)
    // But after typing invalid '#xyz' only, no additional calls
    const callCount = onChange.mock.calls.length;
    // Type more invalid chars
    await userEvent.type(hexInput, 'invalid');
    expect(onChange.mock.calls.length).toBe(callCount);
  });

  it('hue slider is present when popover is open', async () => {
    render(<ColorPicker {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /pick color/i }));
    const hueSlider = screen.getByRole('slider', { name: /hue/i });
    expect(hueSlider).toBeInTheDocument();
    expect(hueSlider).toHaveAttribute('min', '0');
    expect(hueSlider).toHaveAttribute('max', '360');
  });
});
