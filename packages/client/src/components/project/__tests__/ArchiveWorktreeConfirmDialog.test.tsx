import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ArchiveWorktreeConfirmDialog } from '../ArchiveWorktreeConfirmDialog.tsx';

describe('ArchiveWorktreeConfirmDialog', () => {
  it('confirm fires onConfirm with force=false by default', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ArchiveWorktreeConfirmDialog open branch="feat/x" onConfirm={onConfirm} onClose={vi.fn()} />,
    );
    await user.click(screen.getByRole('button', { name: /^archive$/i }));
    expect(onConfirm).toHaveBeenCalledWith({ force: false });
  });

  it('renders Force archive button when dirty=true', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ArchiveWorktreeConfirmDialog
        open
        branch="feat/x"
        dirty
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/uncommitted changes/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /force archive/i }));
    expect(onConfirm).toHaveBeenCalledWith({ force: true });
  });
});
