import {describe, it, expect, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InputField from './InputField';

describe('<InputField />', () => {
  it('renders label associated with the input', () => {
    render(<InputField id="x" label="Email" />);
    const input = screen.getByLabelText('Email');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('id', 'x');
  });

  it('forwards arbitrary input props', async () => {
    const onChange = vi.fn();
    render(
      <InputField
        label="Q"
        value=""
        onChange={onChange}
        placeholder="type"
        type="text"
        inputMode="numeric"
      />
    );
    const input = screen.getByLabelText('Q');
    expect(input).toHaveAttribute('placeholder', 'type');
    expect(input).toHaveAttribute('inputmode', 'numeric');
    await userEvent.type(input, 'a');
    expect(onChange).toHaveBeenCalled();
  });

  it('shows error and wires aria-invalid + aria-describedby', () => {
    render(<InputField id="x" label="Q" error="Bad input" />);
    const input = screen.getByLabelText('Q');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const errorId = input.getAttribute('aria-describedby');
    expect(errorId).toBeTruthy();
    const err = document.getElementById(errorId);
    expect(err).toHaveTextContent('Bad input');
    expect(err).toHaveAttribute('role', 'alert');
  });

  it('shows helper when no error', () => {
    render(<InputField id="x" label="Q" helper="Type something" />);
    expect(screen.getByText('Type something')).toBeInTheDocument();
  });

  it('error overrides helper when both are provided', () => {
    render(
      <InputField id="x" label="Q" helper="hint" error="oops" />
    );
    expect(screen.queryByText('hint')).not.toBeInTheDocument();
    expect(screen.getByText('oops')).toBeInTheDocument();
  });

  it('no error: aria-invalid is omitted', () => {
    render(<InputField id="x" label="Q" />);
    const input = screen.getByLabelText('Q');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('inline mode adds the modifier class', () => {
    const {container} = render(
      <InputField id="x" label="Q" inline />
    );
    expect(container.firstChild).toHaveClass('tool-field--inline');
  });
});
