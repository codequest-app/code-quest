import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { GitStateContext } from '../../contexts/GitContext';
import { ProjectStateContext } from '../../contexts/ProjectContext';
import { RightPaneScopeProvider } from '../../contexts/RightPaneScopeContext';
import { RightPanePaneBar } from '../RightPanePaneBar';

function wrapper(activeCwd: string | null) {
  return ({ children }: { children: ReactNode }) => (
    <ProjectStateContext.Provider
      value={{
        projects: activeCwd
          ? [{ cwd: activeCwd, name: 'my-app', pinned: false, lastOpenedAt: '' }]
          : [],
        activeProjectCwd: activeCwd,
      }}
    >
      <GitStateContext.Provider
        value={{
          listing: activeCwd
            ? { [activeCwd]: [{ name: 'main', path: activeCwd, branch: 'main' }] }
            : {},
        }}
      >
        <RightPaneScopeProvider activeCwd={activeCwd}>{children}</RightPaneScopeProvider>
      </GitStateContext.Provider>
    </ProjectStateContext.Provider>
  );
}

describe('RightPanePaneBar', () => {
  describe('scope label', () => {
    it('shows scope label with project name when cwd is present', () => {
      const Wrapper = wrapper('/projects/my-app');
      render(<RightPanePaneBar closeMode="collapse" />, { wrapper: Wrapper });
      expect(screen.getByTestId('pane-bar-scope-label')).toHaveTextContent('my-app');
    });

    it('shows "— no scope —" when no cwd', () => {
      const Wrapper = wrapper(null);
      render(<RightPanePaneBar closeMode="collapse" />, { wrapper: Wrapper });
      expect(screen.getByTestId('pane-bar-scope-label')).toHaveTextContent('— no scope —');
    });
  });

  describe('follow/pin toggle', () => {
    it('renders a switch with role="switch"', () => {
      const Wrapper = wrapper('/repo');
      render(<RightPanePaneBar closeMode="collapse" />, { wrapper: Wrapper });
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('switch is unchecked (follow) by default', () => {
      const Wrapper = wrapper('/repo');
      render(<RightPanePaneBar closeMode="collapse" />, { wrapper: Wrapper });
      const sw = screen.getByRole('switch');
      expect(sw).toHaveAttribute('aria-checked', 'false');
      expect(sw).toHaveAttribute('data-state', 'unchecked');
    });

    it('clicking switch toggles to pinned (checked)', async () => {
      const user = userEvent.setup();
      const Wrapper = wrapper('/repo');
      render(<RightPanePaneBar closeMode="collapse" />, { wrapper: Wrapper });
      await user.click(screen.getByRole('switch'));
      const sw = screen.getByRole('switch');
      expect(sw).toHaveAttribute('aria-checked', 'true');
      expect(sw).toHaveAttribute('data-state', 'checked');
    });

    it('keyboard Space triggers toggle', async () => {
      const user = userEvent.setup();
      const Wrapper = wrapper('/repo');
      render(<RightPanePaneBar closeMode="collapse" />, { wrapper: Wrapper });
      screen.getByRole('switch').focus();
      await user.keyboard(' ');
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    });

    it('toggle is disabled when no cwd', () => {
      const Wrapper = wrapper(null);
      render(<RightPanePaneBar closeMode="collapse" />, { wrapper: Wrapper });
      expect(screen.getByRole('switch')).toBeDisabled();
    });
  });

  describe('close button', () => {
    it('collapse mode: shows "—" and calls onClose', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const Wrapper = wrapper('/repo');
      render(<RightPanePaneBar closeMode="collapse" onClose={onClose} />, {
        wrapper: Wrapper,
      });
      const btn = screen.getByRole('button', { name: /collapse/i });
      expect(btn).toHaveTextContent('—');
      await user.click(btn);
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('back mode: shows "✕" and calls onClose', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const Wrapper = wrapper('/repo');
      render(<RightPanePaneBar closeMode="back" onClose={onClose} />, { wrapper: Wrapper });
      const btn = screen.getByRole('button', { name: /close|back/i });
      expect(btn).toHaveTextContent('✕');
      await user.click(btn);
      expect(onClose).toHaveBeenCalledOnce();
    });
  });
});
