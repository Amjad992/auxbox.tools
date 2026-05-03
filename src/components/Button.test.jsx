import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';

describe('<Button />', () => {
  it('renders children inside a <button>', () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole('button', { name: /click me/i });
    expect(btn).toBeInTheDocument();
  });

  it('defaults to type="button" and the primary variant', () => {
    render(<Button>X</Button>);
    const btn = screen.getByRole('button', { name: 'X' });
    expect(btn).toHaveAttribute('type', 'button');
    expect(btn).toHaveClass('btn');
    expect(btn).toHaveClass('btn-primary');
  });

  it.each([
    ['primary', 'btn-primary'],
    ['success', 'btn-success'],
    ['danger', 'btn-danger'],
    ['warning', 'btn-warning'],
    ['info', 'btn-info'],
    ['neutral', 'btn-neutral'],
  ])('variant="%s" applies %s', (variant, cls) => {
    render(<Button variant={variant}>X</Button>);
    expect(screen.getByRole('button')).toHaveClass(cls);
  });

  it('block=true applies btn-block', () => {
    render(<Button block>X</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-block');
  });

  it('block=false (default) omits btn-block', () => {
    render(<Button>X</Button>);
    expect(screen.getByRole('button')).not.toHaveClass('btn-block');
  });

  it('forwards extra className', () => {
    render(<Button className="extra">X</Button>);
    expect(screen.getByRole('button')).toHaveClass('extra');
  });

  it('forwards arbitrary props (data-testid, disabled, aria)', () => {
    render(
      <Button data-testid="b" disabled aria-label="save">
        X
      </Button>
    );
    const btn = screen.getByTestId('b');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-label', 'save');
  });

  it('respects an explicit type="submit"', () => {
    render(<Button type="submit">Go</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('fires onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>X</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire onClick when disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        X
      </Button>
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
