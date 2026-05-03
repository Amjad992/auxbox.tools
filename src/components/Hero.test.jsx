import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Hero from './Hero';

describe('<Hero />', () => {
  it('renders the title as an <h1>', () => {
    render(<Hero title="My Tool" />);
    const h = screen.getByRole('heading', { level: 1, name: 'My Tool' });
    expect(h).toBeInTheDocument();
  });

  it('renders the tagline when provided', () => {
    render(<Hero title="t" tagline="line" />);
    const tagline = screen.getByText('line');
    expect(tagline).toBeInTheDocument();
    expect(tagline).toHaveClass('tool-tagline');
  });

  it('omits the tagline node when not provided', () => {
    const { container } = render(<Hero title="t" />);
    expect(container.querySelector('.tool-tagline')).toBeNull();
  });

  it('uses the tool-hero section wrapper', () => {
    const { container } = render(<Hero title="t" />);
    expect(container.firstChild.tagName).toBe('SECTION');
    expect(container.firstChild).toHaveClass('tool-hero');
  });
});
