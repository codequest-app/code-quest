import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import type { WorktreeListingEntry } from '../../contexts/GitContext';
import { GitStateContext } from '../../contexts/GitContext';
import type { Project } from '../../contexts/ProjectContext';
import { ProjectStateContext } from '../../contexts/ProjectContext';
import { RightPaneScopeProvider, useRightPaneScope } from '../../contexts/RightPaneScopeContext';
import { ScopePicker } from '../ScopePicker';

afterEach(() => sessionStorage.clear());

function HookReader() {
  const scope = useRightPaneScope();
  return <div data-testid="scope-debug">{JSON.stringify(scope)}</div>;
}

function setup({
  activeCwd = '/projects/alpha',
  projects = [
    { cwd: '/projects/alpha', name: 'alpha', pinned: false, lastOpenedAt: '' },
    { cwd: '/projects/beta', name: 'beta', pinned: false, lastOpenedAt: '' },
  ] as Project[],
  listing = {
    '/projects/alpha': [
      { name: 'main', path: '/projects/alpha', branch: 'main' },
      { name: 'feat-x', path: '/projects/alpha/.claude/worktrees/feat-x', branch: 'feat-x' },
    ],
    '/projects/beta': [{ name: 'main', path: '/projects/beta', branch: 'develop' }],
  } as Record<string, WorktreeListingEntry>,
  pinnedCwd,
}: {
  activeCwd?: string | null;
  projects?: Project[];
  listing?: Record<string, WorktreeListingEntry>;
  pinnedCwd?: string;
} = {}) {
  if (pinnedCwd) {
    sessionStorage.setItem('right-pane-scope', JSON.stringify({ mode: 'pinned', cwd: pinnedCwd }));
  }

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ProjectStateContext.Provider value={{ projects, activeProjectCwd: activeCwd }}>
        <GitStateContext.Provider value={{ listing }}>
          <RightPaneScopeProvider activeCwd={activeCwd}>
            {children}
            <HookReader />
          </RightPaneScopeProvider>
        </GitStateContext.Provider>
      </ProjectStateContext.Provider>
    );
  }
  const user = userEvent.setup();
  return { user, Wrapper };
}

describe('ScopePicker', () => {
  it('lists all project × worktree items with project name · ⎇ branch', async () => {
    const { user, Wrapper } = setup();
    render(<ScopePicker />, { wrapper: Wrapper });
    await user.click(screen.getByTestId('scope-picker-trigger'));
    expect(screen.getByText('alpha · ⎇ main')).toBeInTheDocument();
    expect(screen.getByText('alpha · ⎇ feat-x')).toBeInTheDocument();
    expect(screen.getByText('beta · ⎇ develop')).toBeInTheDocument();
  });

  it('shows ✓ on the currently pinned worktree', async () => {
    const { user, Wrapper } = setup({ pinnedCwd: '/projects/alpha/.claude/worktrees/feat-x' });
    render(<ScopePicker />, { wrapper: Wrapper });
    await user.click(screen.getByTestId('scope-picker-trigger'));
    const item = screen.getByText('alpha · ⎇ feat-x').closest('[data-testid="scope-item"]')!;
    expect(item.querySelector('[data-check]')).toHaveTextContent('✓');
  });

  it('shows "⇆ Follow active chat tab" at the bottom', async () => {
    const { user, Wrapper } = setup();
    render(<ScopePicker />, { wrapper: Wrapper });
    await user.click(screen.getByTestId('scope-picker-trigger'));
    expect(screen.getByText('Follow active chat tab')).toBeInTheDocument();
  });

  it('clicking a worktree pins to it and closes popover', async () => {
    const { user, Wrapper } = setup();
    render(<ScopePicker />, { wrapper: Wrapper });
    await user.click(screen.getByTestId('scope-picker-trigger'));
    await user.click(screen.getByText('beta · ⎇ develop'));
    expect(screen.getByTestId('scope-debug')).toHaveTextContent(
      JSON.stringify({ mode: 'pinned', cwd: '/projects/beta' }),
    );
    expect(screen.queryByText('Follow active chat tab')).toBeNull();
  });

  it('clicking follow unpins and closes popover', async () => {
    const { user, Wrapper } = setup({ pinnedCwd: '/projects/alpha' });
    render(<ScopePicker />, { wrapper: Wrapper });
    await user.click(screen.getByTestId('scope-picker-trigger'));
    await user.click(screen.getByText('Follow active chat tab'));
    expect(screen.getByTestId('scope-debug')).toHaveTextContent(JSON.stringify({ mode: 'follow' }));
  });

  it('shows placeholder when no worktrees are listed', async () => {
    const { user, Wrapper } = setup({ listing: {} });
    render(<ScopePicker />, { wrapper: Wrapper });
    await user.click(screen.getByTestId('scope-picker-trigger'));
    expect(screen.getByText(/no worktrees/i)).toBeInTheDocument();
  });
});
