import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ResultCard from './ResultCard';

describe('<ResultCard />', () => {
  it('renders the label and value', () => {
    render(<ResultCard label="CGPA" value="3.45" />);
    expect(screen.getByText('CGPA')).toBeInTheDocument();
    expect(screen.getByText('3.45')).toBeInTheDocument();
  });

  it('renders the hint when provided', () => {
    render(<ResultCard label="L" value="V" hint="extra" />);
    expect(screen.getByText('extra')).toBeInTheDocument();
  });

  it('omits the hint paragraph when not provided', () => {
    const { container } = render(<ResultCard label="L" value="V" />);
    expect(container.querySelectorAll('p').length).toBe(0);
  });

  it('uses the tool-result-card and tool-result-value classes', () => {
    const { container } = render(<ResultCard label="L" value="V" />);
    expect(container.firstChild).toHaveClass('tool-result-card');
    expect(container.querySelector('.tool-result-value')).toHaveTextContent('V');
  });

  it('accepts node values (not just strings)', () => {
    render(<ResultCard label={<span>L</span>} value={<strong>42</strong>} />);
    expect(screen.getByText('L')).toBeInTheDocument();
    expect(screen.getByText('42').tagName).toBe('STRONG');
  });
});
