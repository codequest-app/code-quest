import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RemoveWorktreeConfirmDialog } from '../RemoveWorktreeConfirmDialog.tsx';

describe('RemoveWorktreeConfirmDialog', () => {
  it('allowed state (no active sessions): Remove button → onConfirm + close', async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <RemoveWorktreeConfirmDialog
        open
        branch="feat-x"
        activeSessionCount={0}
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );
    await userEvent
      .setup({ pointerEventsCheck: 0 })
      .click(screen.getByRole('button', { name: /^delete$/i }));
    expect(onConfirm).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('blocked state: shows warning + OK only, no Delete button', () => {
    render(
      <RemoveWorktreeConfirmDialog
        open
        branch="busy"
        activeSessionCount={2}
        onConfirm={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/2 active sessions/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ok/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^delete$/i })).toBeNull();
  });

  it('Cancel closes without onConfirm', async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <RemoveWorktreeConfirmDialog
        open
        branch="x"
        activeSessionCount={0}
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );
    await userEvent
      .setup({ pointerEventsCheck: 0 })
      .click(screen.getByRole('button', { name: /cancel/i }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
