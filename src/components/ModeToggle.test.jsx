import {describe, it, expect, vi} from 'vitest';
import {fireEvent, render, screen} from '@testing-library/react';
import ModeToggle from './ModeToggle';

const OPTIONS = [
  {value: 'a', label: 'Alpha'},
  {value: 'b', label: 'Beta'},
  {value: 'c', label: 'Gamma'},
];

describe('<ModeToggle />', () => {
  it('renders one radio per option with the active value marked', () => {
    render(
      <ModeToggle
        ariaLabel="Pick one"
        options={OPTIONS}
        value="b"
        onChange={() => {}}
      />
    );
    const group = screen.getByRole('radiogroup', {name: /pick one/i});
    expect(group).toBeInTheDocument();
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
    expect(radios[0]).toHaveAttribute('aria-checked', 'false');
    expect(radios[1]).toHaveAttribute('aria-checked', 'true');
    expect(radios[1].className).toMatch(/mode-option--active/);
  });

  it('calls onChange with the option value when clicked', () => {
    const onChange = vi.fn();
    render(
      <ModeToggle
        ariaLabel="Pick"
        options={OPTIONS}
        value="a"
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByRole('radio', {name: 'Gamma'}));
    expect(onChange).toHaveBeenCalledWith('c');
  });

  it('does not fire onChange when disabled', () => {
    const onChange = vi.fn();
    render(
      <ModeToggle
        ariaLabel="Pick"
        options={OPTIONS}
        value="a"
        onChange={onChange}
        disabled
      />
    );
    const radio = screen.getByRole('radio', {name: 'Beta'});
    expect(radio).toBeDisabled();
    fireEvent.click(radio);
    expect(onChange).not.toHaveBeenCalled();
  });
});
