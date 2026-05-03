import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

function Bomb() {
  throw new Error('boom');
}

describe('<ErrorBoundary />', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <span>safe</span>
      </ErrorBoundary>
    );
    expect(screen.getByText('safe')).toBeInTheDocument();
  });

  it('renders the fallback when a child throws', () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Clear Data & Reload/i })
    ).toBeInTheDocument();
  });

  it('uses the custom message when provided', () => {
    render(
      <ErrorBoundary message="custom blurb">
        <Bomb />
      </ErrorBoundary>
    );
    expect(screen.getByText('custom blurb')).toBeInTheDocument();
  });

  it('uses the default message when none is provided', () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    expect(
      screen.getByText(/There was an error loading this tool/i)
    ).toBeInTheDocument();
  });

  it('applies the error-boundary wrapper class', () => {
    const { container } = render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    expect(container.querySelector('.error-boundary')).toBeInTheDocument();
  });
});
