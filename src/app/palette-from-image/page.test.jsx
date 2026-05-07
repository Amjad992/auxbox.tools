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

// Mock quantize so we don't need a real canvas in jsdom.
vi.mock('./quantize', () => ({
  medianCut: vi.fn(() => [
    {r: 255, g: 0, b: 0},
    {r: 0, g: 0, b: 255},
  ]),
  extractPixels: vi.fn(() => new Uint8ClampedArray([255, 0, 0, 255])),
}));

// eslint-disable-next-line import/first
import PaletteFromImage from './page';
import {medianCut} from './quantize';

// Stub clipboard for copy tests.
let origClipboard;
beforeAll(() => {
  origClipboard = navigator.clipboard;
  Object.defineProperty(navigator, 'clipboard', {
    value: {writeText: vi.fn(() => Promise.resolve())},
    writable: true,
    configurable: true,
  });
});
afterAll(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value: origClipboard,
    writable: true,
    configurable: true,
  });
});

function makeBitmap(w = 64, h = 64) {
  return {width: w, height: h, close: vi.fn()};
}

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

  it('shows error alert for unsupported file type (S5)', async () => {
    render(<PaletteFromImage />);
    const dropInput = document.querySelector('input[type="file"]');
    const file = new File(['data'], 'test.txt', {type: 'text/plain'});
    fireEvent.change(dropInput, {target: {files: [file]}});
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/unsupported image type/i);
    });
  });

  it('shows error when createImageBitmap rejects (S19)', async () => {
    globalThis.createImageBitmap = vi.fn().mockRejectedValue(new Error('decode failed'));

    render(<PaletteFromImage />);
    const dropInput = document.querySelector('input[type="file"]');
    const file = new File(['data'], 'photo.png', {type: 'image/png'});
    fireEvent.change(dropInput, {target: {files: [file]}});

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/decode failed/i);
    });
  });

  it('extracts palette and shows swatches (S19)', async () => {
    globalThis.createImageBitmap = vi.fn().mockResolvedValue(makeBitmap());

    render(<PaletteFromImage />);
    const dropInput = document.querySelector('input[type="file"]');
    const file = new File(['data'], 'photo.png', {type: 'image/png'});
    fireEvent.change(dropInput, {target: {files: [file]}});

    await waitFor(() => {
      // Two swatches from the mocked medianCut.
      expect(screen.getAllByTitle(/click to copy/i)).toHaveLength(2);
    });
    expect(screen.getByText(/palette \(2\)/i)).toBeInTheDocument();
  });

  it('copy-all shows a success toast (S19)', async () => {
    globalThis.createImageBitmap = vi.fn().mockResolvedValue(makeBitmap());

    render(<PaletteFromImage />);
    const dropInput = document.querySelector('input[type="file"]');
    const file = new File(['data'], 'photo.png', {type: 'image/png'});
    fireEvent.change(dropInput, {target: {files: [file]}});

    await waitFor(() => {
      expect(screen.getByText(/copy all/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/copy all/i));
    await waitFor(() => {
      expect(screen.getByText(/palette copied/i)).toBeInTheDocument();
    });
  });

  it('swatch click triggers copy toast (S19)', async () => {
    globalThis.createImageBitmap = vi.fn().mockResolvedValue(makeBitmap());

    render(<PaletteFromImage />);
    const dropInput = document.querySelector('input[type="file"]');
    const file = new File(['data'], 'photo.png', {type: 'image/png'});
    fireEvent.change(dropInput, {target: {files: [file]}});

    await waitFor(() => {
      expect(screen.getAllByTitle(/click to copy/i).length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByTitle(/click to copy/i)[0]);
    await waitFor(() => {
      expect(screen.getByText(/copied/i)).toBeInTheDocument();
    });
  });

  it('falls back to defaults when storage has garbage (S19)', async () => {
    // The StorageContext reads from localStorage; populate it with garbage.
    const STORAGE_KEY = 'palette_from_image_state';
    localStorage.setItem(STORAGE_KEY, JSON.stringify({colourCount: 99, format: 'invalid'}));

    render(<PaletteFromImage />);
    // Default colourCount = 6 — the input should show 6, not 99.
    await waitFor(() => {
      const input = screen.getByLabelText(/colours/i);
      expect(Number(input.value)).toBe(6);
    });

    localStorage.removeItem(STORAGE_KEY);
  });
});
