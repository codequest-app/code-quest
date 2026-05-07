import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RemoveProjectConfirmDialog } from '../RemoveProjectConfirmDialog.tsx';

describe('RemoveProjectConfirmDialog', () => {
  describe('State A — no active sessions', () => {
    it('shows Remove + Cancel buttons; no warning', () => {
      render(
        <RemoveProjectConfirmDialog
          open
          projectName="cc-office"
          activeSessionCount={0}
          onConfirm={() => {}}
          onClose={() => {}}
        />,
      );
      expect(screen.getByRole('button', { name: /^remove$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.queryByText(/active session/i)).not.toBeInTheDocument();
    });

    it('Remove calls onConfirm + onClose', async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      const onConfirm = vi.fn();
      const onClose = vi.fn();
      render(
        <RemoveProjectConfirmDialog
          open
          projectName="cc-office"
          activeSessionCount={0}
          onConfirm={onConfirm}
          onClose={onClose}
        />,
      );
      await user.click(screen.getByRole('button', { name: /^remove$/i }));
      expect(onConfirm).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });

    it('Cancel calls onClose without onConfirm', async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      const onConfirm = vi.fn();
      const onClose = vi.fn();
      render(
        <RemoveProjectConfirmDialog
          open
          projectName="cc-office"
          activeSessionCount={0}
          onConfirm={onConfirm}
          onClose={onClose}
        />,
      );
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      expect(onClose).toHaveBeenCalled();
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  describe('State B — has active sessions', () => {
    it('shows warning + OK only (no Remove)', () => {
      render(
        <RemoveProjectConfirmDialog
          open
          projectName="cc-office"
          activeSessionCount={2}
          onConfirm={() => {}}
          onClose={() => {}}
        />,
      );
      expect(screen.getByText(/2 active session/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /ok/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^remove$/i })).not.toBeInTheDocument();
    });

    it('OK calls onClose; does not call onConfirm', async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      const onConfirm = vi.fn();
      const onClose = vi.fn();
      render(
        <RemoveProjectConfirmDialog
          open
          projectName="cc-office"
          activeSessionCount={3}
          onConfirm={onConfirm}
          onClose={onClose}
        />,
      );
      await user.click(screen.getByRole('button', { name: /ok/i }));
      expect(onClose).toHaveBeenCalled();
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });
});
