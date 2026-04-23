import { createFakeServer, createTestContainer } from '@code-quest/server/test';
import type { ReactNode } from 'react';
import { NavigationProvider } from '../contexts/NavigationContext';
import { ProjectProvider } from '../contexts/ProjectContext';
import { SessionProvider } from '../contexts/SessionContext';
import { SocketProvider } from '../contexts/SocketContext';
import { WorktreeProvider } from '../contexts/WorktreeContext';
import { FakeSummoner } from './fake-summoner';

export interface ProjectsEnv {
  summoner: FakeSummoner;
  container: ReturnType<typeof createTestContainer>;
  Wrapper: (props: { children: ReactNode }) => ReactNode;
}

/**
 * Full Socket→Session→Project→Navigation→Worktree provider stack for tests
 * that render project/worktree UI (ProjectTree, ProjectCard, CreateWorktreeDialog…).
 *
 * Returns the test-server container so tests that need store access
 * (e.g. `container.get<ProjectStore>(TYPES.ProjectStore)`) can grab it.
 *
 * For hook tests that need a *minimal* wrapper (e.g. just Socket+Worktree),
 * build the wrapper inline — this helper is intentionally full-stack.
 */
export function createProjectsEnv(opts?: { summoner?: FakeSummoner }): ProjectsEnv {
  const container = createTestContainer();
  const server = createFakeServer(container);
  const summoner = opts?.summoner ?? new FakeSummoner(server);

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SocketProvider socket={summoner.socket}>
        <SessionProvider>
          <ProjectProvider>
            <NavigationProvider>
              <WorktreeProvider>{children}</WorktreeProvider>
            </NavigationProvider>
          </ProjectProvider>
        </SessionProvider>
      </SocketProvider>
    );
  }

  return { summoner, container, Wrapper };
}
