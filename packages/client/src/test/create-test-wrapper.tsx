import { createFakeServer, createTestContainer } from '@code-quest/server/test';
import type { ReactNode } from 'react';
import { TooltipProvider } from '../components/ui/Tooltip.tsx';
import { AppInitProvider } from '../contexts/AppInitContext.tsx';
import { FsProvider } from '../contexts/FsContext.tsx';
import { GitProvider } from '../contexts/GitContext.tsx';
import { NavigationProvider } from '../contexts/NavigationContext.tsx';
import { OpenspecProvider } from '../contexts/OpenspecContext.tsx';
import { ProjectProvider } from '../contexts/ProjectContext.tsx';
import { SessionProvider } from '../contexts/SessionContext.tsx';
import { SocketProvider } from '../contexts/SocketContext.tsx';
import { FakeSummoner } from './fake-summoner.ts';

interface TestWrapper {
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
      <TooltipProvider>
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
      </TooltipProvider>
    );
  }

  return { summoner, container, Wrapper };
}
