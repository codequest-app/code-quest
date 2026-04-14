import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ProjectStateContext } from '../../contexts/ProjectContext';
import { ProjectContextMenu } from '../ProjectContextMenu';

/** Provide a minimal ProjectState with worktree capability enabled. */
function WithWorktreeCapability({ children }: { children: ReactNode }) {
  return (
    <ProjectStateContext.Provider
      value={{
        projects: [],
        activeProjectCwd: null,
        sessions: [],
        capabilities: { worktree: true },
        pendingActivateChannel: null,
      }}
    >
      {children}
    </ProjectStateContext.Provider>
  );
}

describe('ProjectContextMenu', () => {
  it('renders the "Resume session…" item; clicking calls onSelectResume', async () => {
    const onSelectResume = vi.fn();
    render(
      <ProjectContextMenu x={100} y={200} onSelectResume={onSelectResume} onClose={() => {}} />,
    );

    const item = screen.getByRole('menuitem', { name: /resume session/i });
    await userEvent.setup({ pointerEventsCheck: 0 }).click(item);
    expect(onSelectResume).toHaveBeenCalledTimes(1);
  });

  it('outside click calls onClose', async () => {
    const onClose = vi.fn();
    render(
      <div>
        <button type="button" data-testid="outside">
          outside
        </button>
        <ProjectContextMenu x={100} y={200} onSelectResume={() => {}} onClose={onClose} />
      </div>,
    );

    await userEvent.setup({ pointerEventsCheck: 0 }).click(screen.getByTestId('outside'));
    expect(onClose).toHaveBeenCalled();
  });

  it('Escape key calls onClose', async () => {
    const onClose = vi.fn();
    render(<ProjectContextMenu x={0} y={0} onSelectResume={() => {}} onClose={onClose} />);

    await userEvent.setup({ pointerEventsCheck: 0 }).keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('positions itself at given x/y via fixed positioning', () => {
    render(<ProjectContextMenu x={42} y={84} onSelectResume={() => {}} onClose={() => {}} />);
    const menu = screen.getByRole('menu');
    expect(menu.style.position).toBe('fixed');
    expect(menu.style.left).toBe('42px');
    expect(menu.style.top).toBe('84px');
  });

  describe('Create Worktree item', () => {
    it('hides the item when no WorktreeProvider (capabilities default to worktree=false)', () => {
      render(
        <ProjectContextMenu
          x={0}
          y={0}
          onSelectResume={() => {}}
          onSelectCreateWorktree={() => {}}
          onClose={() => {}}
        />,
      );
      expect(screen.queryByRole('menuitem', { name: /Create Worktree/i })).not.toBeInTheDocument();
    });

    it('hides the item when onSelectCreateWorktree is not provided (even if capability is true)', () => {
      render(
        <WithWorktreeCapability>
          <ProjectContextMenu x={0} y={0} onSelectResume={() => {}} onClose={() => {}} />
        </WithWorktreeCapability>,
      );
      expect(screen.queryByRole('menuitem', { name: /Create Worktree/i })).not.toBeInTheDocument();
    });

    it('shows the item when capability is true AND handler is provided; clicking fires handler', async () => {
      const onSelectCreateWorktree = vi.fn();
      render(
        <WithWorktreeCapability>
          <ProjectContextMenu
            x={0}
            y={0}
            onSelectResume={() => {}}
            onSelectCreateWorktree={onSelectCreateWorktree}
            onClose={() => {}}
          />
        </WithWorktreeCapability>,
      );
      const item = await screen.findByRole('menuitem', { name: /Create Worktree/i });
      await userEvent.setup({ pointerEventsCheck: 0 }).click(item);
      expect(onSelectCreateWorktree).toHaveBeenCalledTimes(1);
    });
  });
});
