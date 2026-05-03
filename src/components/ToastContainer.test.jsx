import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ToastContainer from './ToastContainer';

const sample = [
  { id: 1, message: 'first', type: 'error' },
  { id: 2, message: 'second', type: 'success' },
];

describe('<ToastContainer />', () => {
  it('renders nothing visible when toasts is empty', () => {
    const { container } = render(
      <ToastContainer toasts={[]} onDismiss={() => {}} />
    );
    expect(container.querySelectorAll('.toast').length).toBe(0);
    expect(container.querySelector('.toast-container')).toBeInTheDocument();
  });

  it('renders one node per toast with type-specific class', () => {
    render(<ToastContainer toasts={sample} onDismiss={() => {}} />);
    expect(screen.getByText('first').closest('.toast')).toHaveClass(
      'toast-error'
    );
    expect(screen.getByText('second').closest('.toast')).toHaveClass(
      'toast-success'
    );
  });

  it('clicking the toast body fires onDismiss with its id', async () => {
    const onDismiss = vi.fn();
    render(<ToastContainer toasts={sample} onDismiss={onDismiss} />);
    await userEvent.click(screen.getByText('first').closest('.toast'));
    expect(onDismiss).toHaveBeenCalledWith(1);
  });

  it('clicking the close button fires onDismiss but not propagates to body', async () => {
    const onDismiss = vi.fn();
    render(<ToastContainer toasts={sample} onDismiss={onDismiss} />);
    const closeBtn = screen.getAllByRole('button', { name: '×' })[1];
    await userEvent.click(closeBtn);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledWith(2);
  });
});
