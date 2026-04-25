import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { ActiveChatTabCwdStateContext } from '../../contexts/ActiveChatTabCwdContext';
import { ProjectStateContext } from '../../contexts/ProjectContext';
import { useActiveCwd } from '../useActiveCwd';

function ProjectStub({ cwd, children }: { cwd: string | null; children: ReactNode }) {
  return (
    <ProjectStateContext.Provider
      value={{
        projects: [],
        activeProjectCwd: cwd,
      }}
    >
      {children}
    </ProjectStateContext.Provider>
  );
}

describe('useActiveCwd', () => {
  it('returns null when rendered outside any provider', () => {
    const { result } = renderHook(() => useActiveCwd());
    expect(result.current).toBeNull();
  });

  it('returns activeProjectCwd when project is active but no active tab', () => {
    function Wrapper({ children }: { children: ReactNode }) {
      return <ProjectStub cwd="/my/project">{children}</ProjectStub>;
    }
    const { result } = renderHook(() => useActiveCwd(), { wrapper: Wrapper });
    expect(result.current).toBe('/my/project');
  });

  it('prefers ActiveChatTabCwdContext.cwd over activeProjectCwd when set', () => {
    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <ActiveChatTabCwdStateContext.Provider value={{ cwd: '/repo/.claude/worktrees/wt' }}>
          <ProjectStub cwd="/repo">{children}</ProjectStub>
        </ActiveChatTabCwdStateContext.Provider>
      );
    }
    const { result } = renderHook(() => useActiveCwd(), { wrapper: Wrapper });
    expect(result.current).toBe('/repo/.claude/worktrees/wt');
  });

  it('falls through when ActiveChatTabCwdContext.cwd is null', () => {
    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <ActiveChatTabCwdStateContext.Provider value={{ cwd: null }}>
          <ProjectStub cwd="/repo">{children}</ProjectStub>
        </ActiveChatTabCwdStateContext.Provider>
      );
    }
    const { result } = renderHook(() => useActiveCwd(), { wrapper: Wrapper });
    expect(result.current).toBe('/repo');
  });
});
