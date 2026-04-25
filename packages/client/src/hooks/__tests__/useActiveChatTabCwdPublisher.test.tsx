import { act, render } from '@testing-library/react';
import { type ReactNode, useEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ActiveChatTabCwdActionsContext } from '../../contexts/ActiveChatTabCwdContext';
import { ProjectStateContext } from '../../contexts/ProjectContext';
import { TabProvider, useTabActions } from '../../contexts/TabContext';
import { useActiveChatTabCwdPublisher } from '../useActiveChatTabCwdPublisher';

function ProjectStub({
  activeProjectCwd,
  children,
}: {
  activeProjectCwd: string | null;
  children: ReactNode;
}) {
  return (
    <ProjectStateContext.Provider value={{ projects: [], activeProjectCwd }}>
      {children}
    </ProjectStateContext.Provider>
  );
}

function CtxStub({
  setCwd,
  children,
}: {
  setCwd: (cwd: string | null) => void;
  children: ReactNode;
}) {
  return (
    <ActiveChatTabCwdActionsContext.Provider value={{ setCwd }}>
      {children}
    </ActiveChatTabCwdActionsContext.Provider>
  );
}

/** Test harness — calls the publisher inside a TabProvider; exposes
 *  TabActions through a ref so tests can drive activeTab changes. */
function Harness({ projectCwd }: { projectCwd: string }) {
  useActiveChatTabCwdPublisher(projectCwd);
  return null;
}

function HarnessWithActions({
  projectCwd,
  onActions,
}: {
  projectCwd: string;
  onActions: (actions: ReturnType<typeof useTabActions>) => void;
}) {
  const actions = useTabActions();
  useEffect(() => {
    onActions(actions);
  }, [actions, onActions]);
  return <Harness projectCwd={projectCwd} />;
}

describe('useActiveChatTabCwdPublisher', () => {
  it('publishes the active tab cwd when this project IS the active project', () => {
    const setCwd = vi.fn();
    let actions: ReturnType<typeof useTabActions> | null = null;
    render(
      <CtxStub setCwd={setCwd}>
        <ProjectStub activeProjectCwd="/repo">
          <TabProvider cwd="/repo">
            <HarnessWithActions
              projectCwd="/repo"
              onActions={(a) => {
                actions = a;
              }}
            />
          </TabProvider>
        </ProjectStub>
      </CtxStub>,
    );
    act(() => {
      actions?.addTab('tab-1', '/repo/.claude/worktrees/wt');
      actions?.setActiveTab('tab-1');
    });
    expect(setCwd).toHaveBeenLastCalledWith('/repo/.claude/worktrees/wt');
  });

  it('clears cwd to null when this project transitions from active to inactive', () => {
    const setCwd = vi.fn();
    let actions: ReturnType<typeof useTabActions> | null = null;
    function Wrapper({ activeProjectCwd }: { activeProjectCwd: string }) {
      return (
        <CtxStub setCwd={setCwd}>
          <ProjectStub activeProjectCwd={activeProjectCwd}>
            <TabProvider cwd="/repo">
              <HarnessWithActions
                projectCwd="/repo"
                onActions={(a) => {
                  actions = a;
                }}
              />
            </TabProvider>
          </ProjectStub>
        </CtxStub>
      );
    }
    const { rerender } = render(<Wrapper activeProjectCwd="/repo" />);
    act(() => {
      actions?.addTab('tab-1', '/repo/sub');
      actions?.setActiveTab('tab-1');
    });
    setCwd.mockClear();
    rerender(<Wrapper activeProjectCwd="/other" />);
    expect(setCwd).toHaveBeenCalledWith(null);
  });

  it('switching active tab while this project stays active does NOT flap to null', () => {
    const setCwd = vi.fn();
    let actions: ReturnType<typeof useTabActions> | null = null;
    render(
      <CtxStub setCwd={setCwd}>
        <ProjectStub activeProjectCwd="/repo">
          <TabProvider cwd="/repo">
            <HarnessWithActions
              projectCwd="/repo"
              onActions={(a) => {
                actions = a;
              }}
            />
          </TabProvider>
        </ProjectStub>
      </CtxStub>,
    );
    act(() => {
      actions?.addTab('tab-1', '/repo/a');
      actions?.setActiveTab('tab-1');
      actions?.addTab('tab-2', '/repo/b');
    });
    setCwd.mockClear();
    act(() => {
      actions?.setActiveTab('tab-2');
    });
    // Subscribers should see exactly one update (to '/repo/b'), not a
    // transient null in between.
    expect(setCwd).not.toHaveBeenCalledWith(null);
    expect(setCwd).toHaveBeenLastCalledWith('/repo/b');
  });

  it('does NOT publish when this project is NOT the active project', () => {
    const setCwd = vi.fn();
    let actions: ReturnType<typeof useTabActions> | null = null;
    render(
      <CtxStub setCwd={setCwd}>
        <ProjectStub activeProjectCwd="/other">
          <TabProvider cwd="/repo">
            <HarnessWithActions
              projectCwd="/repo"
              onActions={(a) => {
                actions = a;
              }}
            />
          </TabProvider>
        </ProjectStub>
      </CtxStub>,
    );
    setCwd.mockClear();
    act(() => {
      actions?.addTab('tab-1', '/repo/sub');
      actions?.setActiveTab('tab-1');
    });
    expect(setCwd).not.toHaveBeenCalled();
  });
});
