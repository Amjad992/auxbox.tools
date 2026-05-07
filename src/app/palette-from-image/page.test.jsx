import {describe, it, expect, vi} from 'vitest';
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
import PaletteFromImage from './page';

describe('<PaletteFromImage />', () => {
  it('renders heading + drop zone + format select', () => {
    render(<PaletteFromImage />);
    expect(
      screen.getByRole('heading', {name: /palette from image/i})
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/format/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/colours/i)).toBeInTheDocument();
    expect(screen.getByText(/drop an image/i)).toBeInTheDocument();
  });
});
