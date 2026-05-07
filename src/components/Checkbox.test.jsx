import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Checkbox from './Checkbox';

describe('<Checkbox />', () => {
  it('renders the label text', () => {
    render(<Checkbox label="Enable notifications" checked={false} onChange={() => {}} />);
    expect(screen.getByText('Enable notifications')).toBeInTheDocument();
  });

  it('renders as unchecked when checked=false', () => {
    render(<Checkbox label="Option" checked={false} onChange={() => {}} />);
    const input = screen.getByRole('checkbox');
    expect(input).not.toBeChecked();
  });

  it('renders as checked when checked=true', () => {
    render(<Checkbox label="Option" checked={true} onChange={() => {}} />);
    const input = screen.getByRole('checkbox');
    expect(input).toBeChecked();
  });

  it('calls onChange with true when toggled from unchecked', async () => {
    const onChange = vi.fn();
    render(<Checkbox label="Option" checked={false} onChange={onChange} />);
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange with false when toggled from checked', async () => {
    const onChange = vi.fn();
    render(<Checkbox label="Option" checked={true} onChange={onChange} />);
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('toggles on Space key press', async () => {
    const onChange = vi.fn();
    render(<Checkbox label="Option" checked={false} onChange={onChange} />);
    const input = screen.getByRole('checkbox');
    input.focus();
    await userEvent.keyboard(' ');
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('controlled value reflects the checked prop', () => {
    const { rerender } = render(
      <Checkbox label="Option" checked={false} onChange={() => {}} />
    );
    expect(screen.getByRole('checkbox')).not.toBeChecked();

    rerender(<Checkbox label="Option" checked={true} onChange={() => {}} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('does not fire onChange when disabled', async () => {
    const onChange = vi.fn();
    render(
      <Checkbox label="Option" checked={false} onChange={onChange} disabled />
    );
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('the native input is disabled when disabled prop is set', () => {
    render(
      <Checkbox label="Option" checked={false} onChange={() => {}} disabled />
    );
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('renders optional description text', () => {
    render(
      <Checkbox
        label="Keep PNG lossless"
        description="Off keeps PNGs lossless. On re-encodes."
        checked={false}
        onChange={() => {}}
      />
    );
    expect(screen.getByText(/Off keeps PNGs lossless/)).toBeInTheDocument();
  });

  it('forwards id to the input', () => {
    render(<Checkbox id="my-cb" label="Option" checked={false} onChange={() => {}} />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('id', 'my-cb');
  });

  it('label element is associated with the input via htmlFor', () => {
    render(<Checkbox id="test-cb" label="Toggle me" checked={false} onChange={() => {}} />);
    const input = screen.getByRole('checkbox');
    // Clicking the label text should trigger the checkbox (HTMLFor association)
    const labelText = screen.getByText('Toggle me');
    // The label element itself is the containing label
    expect(labelText.closest('label')).toHaveAttribute('for', 'test-cb');
  });
});
