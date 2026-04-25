import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RenameWorktreeDialog } from '../RenameWorktreeDialog';

describe('RenameWorktreeDialog', () => {
  it('pre-fills input with current branch name', () => {
    render(
      <RenameWorktreeDialog open currentBranch="feat/x" onSubmit={vi.fn()} onClose={vi.fn()} />,
    );
    expect(screen.getByRole('textbox')).toHaveValue('feat/x');
  });

  it('Rename button submits trimmed name', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<RenameWorktreeDialog open currentBranch="old" onSubmit={onSubmit} onClose={vi.fn()} />);
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, '  new-name  ');
    await user.click(screen.getByRole('button', { name: /rename/i }));
    expect(onSubmit).toHaveBeenCalledWith('new-name');
  });

  it('shows validation error for invalid characters', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<RenameWorktreeDialog open currentBranch="old" onSubmit={onSubmit} onClose={vi.fn()} />);
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'has spaces');
    await user.click(screen.getByRole('button', { name: /rename/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/only letters/i)).toBeInTheDocument();
  });

  it('closes without submitting when name unchanged', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onClose = vi.fn();
    render(
      <RenameWorktreeDialog open currentBranch="same" onSubmit={onSubmit} onClose={onClose} />,
    );
    await user.click(screen.getByRole('button', { name: /rename/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
