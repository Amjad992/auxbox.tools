import {describe, it, expect, vi, beforeAll, afterAll} from 'vitest';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';

vi.mock('next/script', () => ({
  default: ({children, dangerouslySetInnerHTML}) =>
    dangerouslySetInnerHTML ? (
      <script dangerouslySetInnerHTML={dangerouslySetInnerHTML} />
    ) : (
      <script>{children}</script>
    ),
}));

vi.mock('./pipeline', () => ({
  generateFavicons: vi.fn(),
}));

// eslint-disable-next-line import/first
import FaviconGenerator from './page';
import {generateFavicons} from './pipeline';

// jsdom doesn't implement URL.createObjectURL.
let origCreateObjectURL;
let origRevokeObjectURL;
beforeAll(() => {
  origCreateObjectURL = URL.createObjectURL;
  origRevokeObjectURL = URL.revokeObjectURL;
  URL.createObjectURL = vi.fn(() => 'blob:fake-url');
  URL.revokeObjectURL = vi.fn();
});
afterAll(() => {
  URL.createObjectURL = origCreateObjectURL;
  URL.revokeObjectURL = origRevokeObjectURL;
});

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

  it('shows error alert for unsupported file type', async () => {
    render(<FaviconGenerator />);
    const dropInput = document.querySelector('input[type="file"]');
    const file = new File(['data'], 'test.txt', {type: 'text/plain'});
    fireEvent.change(dropInput, {target: {files: [file]}});
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/unsupported image type/i);
    });
  });

  it('shows stale notice when settings change after result', async () => {
    const fakeBlob = new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], {type: 'image/png'});
    generateFavicons.mockResolvedValue({
      pngs: [
        {filename: 'favicon-16x16.png', size: 16, blob: fakeBlob},
        {filename: 'favicon-32x32.png', size: 32, blob: fakeBlob},
        {filename: 'apple-touch-icon.png', size: 180, blob: fakeBlob},
        {filename: 'android-chrome-192x192.png', size: 192, blob: fakeBlob},
        {filename: 'android-chrome-512x512.png', size: 512, blob: fakeBlob},
      ],
      ico: fakeBlob,
    });

    // Stub createImageBitmap so pipeline and createImageBitmapInfo work.
    globalThis.createImageBitmap = vi.fn().mockResolvedValue({
      width: 512,
      height: 512,
      close: vi.fn(),
    });

    render(<FaviconGenerator />);
    const dropInput = document.querySelector('input[type="file"]');
    const file = new File(['data'], 'logo.png', {type: 'image/png'});

    // Trigger a drop with a valid PNG.
    fireEvent.change(dropInput, {target: {files: [file]}});

    // Wait for result to appear.
    await waitFor(() => {
      expect(screen.getByText(/generated set/i)).toBeInTheDocument();
    });

    // Change a setting — this should trigger the stale notice.
    const bgSelect = screen.getByLabelText(/background/i);
    fireEvent.change(bgSelect, {target: {value: 'white'}});

    await waitFor(() => {
      expect(screen.getByText(/settings changed/i)).toBeInTheDocument();
    });
  });
});
