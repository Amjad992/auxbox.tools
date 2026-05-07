import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen} from '@testing-library/react';

vi.mock('next/script', () => ({
  default: ({children, dangerouslySetInnerHTML}) =>
    dangerouslySetInnerHTML ? (
      <script dangerouslySetInnerHTML={dangerouslySetInnerHTML} />
    ) : (
      <script>{children}</script>
    ),
}));

// eslint-disable-next-line import/first
import PdfSplitter from './page';

beforeEach(() => {
  window.localStorage.clear();
});

describe('<PdfSplitter />', () => {
  it('renders heading, dropzone label, and Clear all', () => {
    render(<PdfSplitter />);
    expect(
      screen.getByRole('heading', {name: /pdf splitter/i})
    ).toBeInTheDocument();
    expect(
      screen.getByText(/drop a pdf or click to pick one/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {name: /clear all/i})
    ).toBeInTheDocument();
  });

  it('does not show the page-range card before a file is loaded', () => {
    render(<PdfSplitter />);
    expect(screen.queryByLabelText(/page range/i)).not.toBeInTheDocument();
  });
});
