import {describe, it, expect, vi} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import Slider from './Slider';

describe('<Slider />', () => {
  function setup(props = {}) {
    const onChange = vi.fn();
    const utils = render(
      <Slider
        id="test-slider"
        label="Length"
        value={10}
        min={6}
        max={64}
        onChange={onChange}
        {...props}
      />
    );
    return {onChange, ...utils};
  }

  it('renders label, value readout, and end-of-track hints', () => {
    setup();
    expect(screen.getByText('Length')).toBeInTheDocument();
    // Value readout shows the numeric value.
    expect(screen.getByText('10')).toBeInTheDocument();
    // Default hints are min/max.
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('64')).toBeInTheDocument();
  });

  it('calls onChange with a numeric value in range', () => {
    const {onChange} = setup();
    const input = screen.getByLabelText('Length');
    fireEvent.change(input, {target: {value: '20'}});
    expect(onChange).toHaveBeenCalledWith(20);
  });

  it('rejects non-integer values when step defaults to 1', () => {
    const {onChange} = setup();
    const input = screen.getByLabelText('Length');
    // Programmatically set to a fractional value — handler must drop it.
    fireEvent.change(input, {target: {value: '20.5'}});
    expect(onChange).not.toHaveBeenCalled();
  });

  it('accepts fractional values when step is fractional', () => {
    const onChange = vi.fn();
    render(
      <Slider
        id="quality"
        label="Quality"
        value={0.8}
        min={0.1}
        max={1}
        step={0.05}
        onChange={onChange}
      />
    );
    const input = screen.getByLabelText('Quality');
    fireEvent.change(input, {target: {value: '0.5'}});
    expect(onChange).toHaveBeenCalledWith(0.5);
  });

  it('uses formatValue for the readout', () => {
    render(
      <Slider
        id="quality"
        label="Quality"
        value={0.8}
        min={0.1}
        max={1}
        step={0.05}
        onChange={() => {}}
        formatValue={(v) => `${Math.round(v * 100)}%`}
      />
    );
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('uses custom hints when provided', () => {
    setup({leftHint: 'Smaller', rightHint: 'Larger'});
    expect(screen.getByText('Smaller')).toBeInTheDocument();
    expect(screen.getByText('Larger')).toBeInTheDocument();
  });

  it('exposes ARIA range attributes', () => {
    setup({value: 18});
    const input = screen.getByLabelText('Length');
    expect(input).toHaveAttribute('aria-valuemin', '6');
    expect(input).toHaveAttribute('aria-valuemax', '64');
    expect(input).toHaveAttribute('aria-valuenow', '18');
  });

  it('honours disabled', () => {
    setup({disabled: true});
    expect(screen.getByLabelText('Length')).toBeDisabled();
  });
});
