import { act, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { createFakeSummoner } from '../../../test/fake-summoner';
import { NavigationProvider, useNavigationActions } from '../../NavigationContext';
import { ProjectProvider } from '../../ProjectContext';
import { SessionProvider } from '../../SessionContext';
import { SocketProvider } from '../../SocketContext';
import { TabProvider, useTabState } from '../../TabContext';

function Probe() {
  const { tabs, activeTabId } = useTabState();
  const cwd = activeTabId ? tabs[activeTabId]?.cwd : null;
  return (
    <>
      <span data-testid="tab-count">{Object.keys(tabs).length}</span>
      <span data-testid="active-cwd">{cwd ?? 'null'}</span>
    </>
  );
}

function Trigger({
  projectCwd,
  worktreeCwd,
  forceNew,
}: {
  projectCwd: string;
  worktreeCwd: string;
  forceNew?: boolean;
}) {
  const { requestOpenWorktree } = useNavigationActions();
  return (
    <button
      type="button"
      onClick={() => requestOpenWorktree(projectCwd, worktreeCwd, forceNew)}
      data-testid="trigger"
    >
      open
    </button>
  );
}

function Wrapper({ projectCwd, children }: { projectCwd: string; children: ReactNode }) {
  const summoner = createFakeSummoner();
  return (
    <SocketProvider socket={summoner.socket}>
      <SessionProvider>
        <ProjectProvider>
          <NavigationProvider>
            <TabProvider cwd={projectCwd}>{children}</TabProvider>
          </NavigationProvider>
        </ProjectProvider>
      </SessionProvider>
    </SocketProvider>
  );
}

describe('TabProvider: pendingOpenWorktree consumption', () => {
  it('intent with matching projectCwd + no existing tab → creates tab (mockup openWt)', async () => {
    render(
      <Wrapper projectCwd="/repo">
        <Probe />
        <Trigger projectCwd="/repo" worktreeCwd="/repo/.claude/worktrees/feat-x" />
      </Wrapper>,
    );
    expect(screen.getByTestId('tab-count').textContent).toBe('0');

    await act(async () => {
      screen.getByTestId('trigger').click();
    });

    expect(screen.getByTestId('tab-count').textContent).toBe('1');
    expect(screen.getByTestId('active-cwd').textContent).toBe('/repo/.claude/worktrees/feat-x');
  });

  it('forceNew=true: each click creates a new tab', async () => {
    render(
      <Wrapper projectCwd="/repo">
        <Probe />
        <Trigger projectCwd="/repo" worktreeCwd="/repo/.claude/worktrees/feat-x" forceNew />
      </Wrapper>,
    );
    expect(screen.getByTestId('tab-count').textContent).toBe('0');

    await act(async () => {
      screen.getByTestId('trigger').click();
    });
    expect(screen.getByTestId('tab-count').textContent).toBe('1');

    await act(async () => {
      screen.getByTestId('trigger').click();
    });
    expect(screen.getByTestId('tab-count').textContent).toBe('2');
  });

  it('intent with non-matching projectCwd → ignored by this TabProvider', async () => {
    render(
      <Wrapper projectCwd="/repo">
        <Probe />
        <Trigger projectCwd="/other" worktreeCwd="/other/.claude/worktrees/x" />
      </Wrapper>,
    );

    await act(async () => {
      screen.getByTestId('trigger').click();
    });

    expect(screen.getByTestId('tab-count').textContent).toBe('0');
  });
});
