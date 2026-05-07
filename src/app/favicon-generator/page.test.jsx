import {describe, it, expect, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('next/script', () => ({
  default: ({children, dangerouslySetInnerHTML}) =>
    dangerouslySetInnerHTML ? (
      <script dangerouslySetInnerHTML={dangerouslySetInnerHTML} />
    ) : (
      <script>{children}</script>
    ),
}));

// eslint-disable-next-line import/first
import FaviconGenerator from './page';

describe('<FaviconGenerator />', () => {
  it('renders heading + drop zone + background select', () => {
    render(<FaviconGenerator />);
    expect(
      screen.getByRole('heading', {name: /favicon generator/i})
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/background/i)).toBeInTheDocument();
    expect(screen.getByText(/drop an image/i)).toBeInTheDocument();
  });

  it('shows include-ICO toggle', () => {
    render(<FaviconGenerator />);
    expect(screen.getByLabelText(/include favicon\.ico/i)).toBeInTheDocument();
  });
});
