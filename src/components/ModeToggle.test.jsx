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

describe('<ModeToggle /> — roving tabindex', () => {
  it('only the active option has tabIndex 0; others have -1', () => {
    render(
      <ModeToggle
        ariaLabel="Pick"
        options={OPTIONS}
        value="b"
        onChange={() => {}}
      />
    );
    const radios = screen.getAllByRole('radio');
    expect(radios[0]).toHaveAttribute('tabindex', '-1'); // Alpha
    expect(radios[1]).toHaveAttribute('tabindex', '0');  // Beta (active)
    expect(radios[2]).toHaveAttribute('tabindex', '-1'); // Gamma
  });

  it('initial render with first option active gives tabIndex 0 to first only', () => {
    render(
      <ModeToggle
        ariaLabel="Pick"
        options={OPTIONS}
        value="a"
        onChange={() => {}}
      />
    );
    const radios = screen.getAllByRole('radio');
    expect(radios[0]).toHaveAttribute('tabindex', '0');
    expect(radios[1]).toHaveAttribute('tabindex', '-1');
    expect(radios[2]).toHaveAttribute('tabindex', '-1');
  });
});

describe('<ModeToggle /> — keyboard navigation', () => {
  it('ArrowRight moves to the next option', () => {
    const onChange = vi.fn();
    render(
      <ModeToggle
        ariaLabel="Pick"
        options={OPTIONS}
        value="a"
        onChange={onChange}
      />
    );
    const group = screen.getByRole('radiogroup');
    fireEvent.keyDown(group, {key: 'ArrowRight'});
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('ArrowRight at the last option wraps to the first', () => {
    const onChange = vi.fn();
    render(
      <ModeToggle
        ariaLabel="Pick"
        options={OPTIONS}
        value="c"
        onChange={onChange}
      />
    );
    const group = screen.getByRole('radiogroup');
    fireEvent.keyDown(group, {key: 'ArrowRight'});
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('ArrowLeft moves to the previous option', () => {
    const onChange = vi.fn();
    render(
      <ModeToggle
        ariaLabel="Pick"
        options={OPTIONS}
        value="b"
        onChange={onChange}
      />
    );
    const group = screen.getByRole('radiogroup');
    fireEvent.keyDown(group, {key: 'ArrowLeft'});
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('ArrowLeft at the first option wraps to the last', () => {
    const onChange = vi.fn();
    render(
      <ModeToggle
        ariaLabel="Pick"
        options={OPTIONS}
        value="a"
        onChange={onChange}
      />
    );
    const group = screen.getByRole('radiogroup');
    fireEvent.keyDown(group, {key: 'ArrowLeft'});
    expect(onChange).toHaveBeenCalledWith('c');
  });

  it('ArrowDown moves to the next option', () => {
    const onChange = vi.fn();
    render(
      <ModeToggle
        ariaLabel="Pick"
        options={OPTIONS}
        value="a"
        onChange={onChange}
      />
    );
    const group = screen.getByRole('radiogroup');
    fireEvent.keyDown(group, {key: 'ArrowDown'});
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('ArrowUp moves to the previous option', () => {
    const onChange = vi.fn();
    render(
      <ModeToggle
        ariaLabel="Pick"
        options={OPTIONS}
        value="b"
        onChange={onChange}
      />
    );
    const group = screen.getByRole('radiogroup');
    fireEvent.keyDown(group, {key: 'ArrowUp'});
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('Home moves to the first option', () => {
    const onChange = vi.fn();
    render(
      <ModeToggle
        ariaLabel="Pick"
        options={OPTIONS}
        value="c"
        onChange={onChange}
      />
    );
    const group = screen.getByRole('radiogroup');
    fireEvent.keyDown(group, {key: 'Home'});
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('End moves to the last option', () => {
    const onChange = vi.fn();
    render(
      <ModeToggle
        ariaLabel="Pick"
        options={OPTIONS}
        value="a"
        onChange={onChange}
      />
    );
    const group = screen.getByRole('radiogroup');
    fireEvent.keyDown(group, {key: 'End'});
    expect(onChange).toHaveBeenCalledWith('c');
  });

  it('arrow keys do not fire onChange when disabled', () => {
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
    const group = screen.getByRole('radiogroup');
    fireEvent.keyDown(group, {key: 'ArrowRight'});
    expect(onChange).not.toHaveBeenCalled();
  });

  it('after ArrowRight, focus moves to the newly-selected radio', () => {
    // We need a controlled wrapper so the active index actually changes
    // (jsdom tracks focus on the real DOM element).
    const {rerender} = render(
      <ModeToggle
        ariaLabel="Pick"
        options={OPTIONS}
        value="a"
        onChange={(v) => {
          rerender(
            <ModeToggle
              ariaLabel="Pick"
              options={OPTIONS}
              value={v}
              onChange={() => {}}
            />
          );
        }}
      />
    );
    const group = screen.getByRole('radiogroup');
    fireEvent.keyDown(group, {key: 'ArrowRight'});
    // After rerender with value="b", the second radio (index 1) should have focus.
    const radios = screen.getAllByRole('radio');
    expect(document.activeElement).toBe(radios[1]);
  });
});
