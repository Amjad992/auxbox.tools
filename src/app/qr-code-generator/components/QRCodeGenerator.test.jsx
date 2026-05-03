import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen} from '@testing-library/react';
import QRCodeGenerator from './QRCodeGenerator';

// Mock the qrcode library so it doesn't try to render a canvas.
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,fake'),
  },
}));

describe('<QRCodeGenerator />', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Issue 1: QR generator now uses the shared <DropZone> component.
  // Assert it renders via the shared component's accessible role/label, NOT
  // by querying the old .qr-dropzone class.
  it('renders the logo dropzone via the shared <DropZone> (role=button with label)', () => {
    render(<QRCodeGenerator />);
    const dropzone = screen.getByRole('button', {
      name: /Drop an image here or click to upload/i,
    });
    expect(dropzone).toBeInTheDocument();
    // Verify it's the shared DropZone (has tool-dropzone class, not qr-dropzone).
    expect(dropzone.className).toContain('tool-dropzone');
    expect(dropzone.className).not.toContain('qr-dropzone');
  });

  it('renders the hint text inside the dropzone', () => {
    render(<QRCodeGenerator />);
    expect(
      screen.getByText(/PNG, JPG, SVG, WebP — any image works/i)
    ).toBeInTheDocument();
  });

  it('shows the Generate QR Code button', () => {
    render(<QRCodeGenerator />);
    expect(
      screen.getByRole('button', {name: /Generate QR Code/i})
    ).toBeInTheDocument();
  });
});
