import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { createFakeSummoner } from '../../test/fake-summoner';
import { ProjectProvider, useProjectActions, useProjectState } from '../ProjectContext';
import { SessionProvider } from '../SessionContext';
import { SocketProvider } from '../SocketContext';

function Wrapper({ children }: { children: ReactNode }) {
  const summoner = createFakeSummoner();
  return (
    <SocketProvider socket={summoner.socket}>
      <SessionProvider>
        <ProjectProvider>{children}</ProjectProvider>
      </SessionProvider>
    </SocketProvider>
  );
}

describe('ProjectContext', () => {
  it('starts with no projects and no active project', () => {
    const { result } = renderHook(
      () => ({ state: useProjectState(), actions: useProjectActions() }),
      { wrapper: Wrapper },
    );
    expect(result.current.state.projects).toEqual([]);
    expect(result.current.state.activeProjectCwd).toBeNull();
  });

  it('addProject adds a project and sets it as active', () => {
    const { result } = renderHook(
      () => ({ state: useProjectState(), actions: useProjectActions() }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.actions.addProject('/path/to/cc-office');
    });

    expect(result.current.state.projects).toEqual([
      { cwd: '/path/to/cc-office', name: 'cc-office' },
    ]);
    expect(result.current.state.activeProjectCwd).toBe('/path/to/cc-office');
  });

  it('addProject does not duplicate existing project', () => {
    const { result } = renderHook(
      () => ({ state: useProjectState(), actions: useProjectActions() }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.actions.addProject('/path/to/cc-office');
      result.current.actions.addProject('/path/to/DQ');
      result.current.actions.addProject('/path/to/cc-office');
    });

    expect(result.current.state.projects).toHaveLength(2);
  });

  it('setActiveProject switches active project', () => {
    const { result } = renderHook(
      () => ({ state: useProjectState(), actions: useProjectActions() }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.actions.addProject('/path/to/cc-office');
      result.current.actions.addProject('/path/to/DQ');
    });

    act(() => {
      result.current.actions.setActiveProject('/path/to/DQ');
    });

    expect(result.current.state.activeProjectCwd).toBe('/path/to/DQ');
  });
});
