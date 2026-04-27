import { createFakeServer, createTestContainer } from '@code-quest/server/test';
import type { ReactNode } from 'react';
import { AppInitProvider } from '../contexts/AppInitContext';
import { FsProvider } from '../contexts/FsContext';
import { GitProvider } from '../contexts/GitContext';
import { NavigationProvider } from '../contexts/NavigationContext';
import { OpenspecProvider } from '../contexts/OpenspecContext';
import { ProjectProvider } from '../contexts/ProjectContext';
import { SessionProvider } from '../contexts/SessionContext';
import { SocketProvider } from '../contexts/SocketContext';
import { FakeSummoner } from './fake-summoner';

export interface TestWrapper {
  summoner: FakeSummoner;
  container: ReturnType<typeof createTestContainer>;
  Wrapper: (props: { children: ReactNode }) => ReactNode;
}

export function createTestWrapper(opts?: { summoner?: FakeSummoner }): TestWrapper {
  const container = createTestContainer();
  const server = createFakeServer(container);
  const summoner = opts?.summoner ?? new FakeSummoner(server);

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SocketProvider socket={summoner.socket}>
        <AppInitProvider>
          <SessionProvider>
            <ProjectProvider>
              <NavigationProvider>
                <GitProvider>
                  <FsProvider>
                    <OpenspecProvider>{children}</OpenspecProvider>
                  </FsProvider>
                </GitProvider>
              </NavigationProvider>
            </ProjectProvider>
          </SessionProvider>
        </AppInitProvider>
      </SocketProvider>
    );
  }

  return { summoner, container, Wrapper };
}
