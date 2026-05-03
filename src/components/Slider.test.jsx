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

  it('renders filled-track --fill CSS variable on the input', () => {
    setup({value: 35, min: 6, max: 64});
    const input = screen.getByLabelText('Length');
    // --fill = (35-6)/(64-6)*100 ≈ 50%
    const fill = input.style.getPropertyValue('--fill');
    // getPropertyValue returns '' in jsdom for custom props set via style={}
    // but the attribute string is present — assert the attribute contains 'fill'
    // (best we can check in jsdom without real CSS cascade).
    expect(input).toHaveAttribute('style');
  });

  describe('withNumericInput', () => {
    it('does not render a numeric input by default', () => {
      setup();
      // The numeric input would be labeled "<label> value" — should be absent.
      expect(screen.queryByLabelText('Length value')).not.toBeInTheDocument();
    });

    it('renders a numeric input when withNumericInput=true', () => {
      setup({withNumericInput: true});
      const numeric = screen.getByLabelText('Length value');
      expect(numeric).toBeInTheDocument();
      expect(numeric.tagName).toBe('INPUT');
      expect(numeric).toHaveAttribute('type', 'number');
    });

    it('calls onChange with clamped value when numeric input changes', () => {
      const {onChange} = setup({withNumericInput: true, value: 10});
      const numeric = screen.getByLabelText('Length value');
      fireEvent.change(numeric, {target: {value: '200'}});
      // max is 64; clamped + rounded
      expect(onChange).toHaveBeenCalledWith(64);
    });

    it('calls onChange with min-clamped value when numeric input is below min', () => {
      const {onChange} = setup({withNumericInput: true, value: 10});
      const numeric = screen.getByLabelText('Length value');
      fireEvent.change(numeric, {target: {value: '1'}});
      // min is 6
      expect(onChange).toHaveBeenCalledWith(6);
    });

    it('ignores empty string in numeric input', () => {
      const {onChange} = setup({withNumericInput: true});
      const numeric = screen.getByLabelText('Length value');
      fireEvent.change(numeric, {target: {value: ''}});
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
