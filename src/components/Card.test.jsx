import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Card from './Card';

describe('<Card />', () => {
  it('renders a <section> by default with the tool-card class', () => {
    const { container } = render(<Card>hi</Card>);
    const node = container.firstChild;
    expect(node.tagName).toBe('SECTION');
    expect(node).toHaveClass('tool-card');
  });

  it('inset adds tool-card--inset', () => {
    const { container } = render(<Card inset>hi</Card>);
    expect(container.firstChild).toHaveClass('tool-card--inset');
  });

  it('omits the inset modifier by default', () => {
    const { container } = render(<Card>hi</Card>);
    expect(container.firstChild).not.toHaveClass('tool-card--inset');
  });

  it('can be rendered as a different tag via `as`', () => {
    const { container } = render(<Card as="article">hi</Card>);
    expect(container.firstChild.tagName).toBe('ARTICLE');
  });

  it('forwards className alongside built-in classes', () => {
    const { container } = render(<Card className="x">hi</Card>);
    expect(container.firstChild).toHaveClass('tool-card');
    expect(container.firstChild).toHaveClass('x');
  });

  it('forwards arbitrary props', () => {
    render(
      <Card data-testid="c" aria-label="a">
        hi
      </Card>
    );
    expect(screen.getByTestId('c')).toHaveAttribute('aria-label', 'a');
  });

  it('renders children', () => {
    render(<Card>hello inside</Card>);
    expect(screen.getByText('hello inside')).toBeInTheDocument();
  });
});
