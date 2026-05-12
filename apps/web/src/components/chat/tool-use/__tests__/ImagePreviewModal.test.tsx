import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ImagePreviewModal } from '../ImagePreviewModal.tsx';

describe('ImagePreviewModal', () => {
  it('renders the image when open', () => {
    render(<ImagePreviewModal src="blob:fake" alt="photo.png" onClose={vi.fn()} />);
    expect(screen.getByRole('img', { name: 'photo.png' })).toHaveAttribute('src', 'blob:fake');
  });

  it('calls onClose when overlay is clicked', async () => {
    const onClose = vi.fn();
    render(<ImagePreviewModal src="blob:fake" alt="photo.png" onClose={onClose} />);
    await userEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when ESC is pressed', () => {
    const onClose = vi.fn();
    render(<ImagePreviewModal src="blob:fake" alt="photo.png" onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('does not call onClose when clicking the image itself', async () => {
    const onClose = vi.fn();
    render(<ImagePreviewModal src="blob:fake" alt="photo.png" onClose={onClose} />);
    await userEvent.click(screen.getByRole('img', { name: 'photo.png' }));
    expect(onClose).not.toHaveBeenCalled();
  });
});
