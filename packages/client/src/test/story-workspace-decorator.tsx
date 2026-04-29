import { EVENTS, type SessionStateSummary } from '@code-quest/shared';
import { AppInitProvider } from '../contexts/AppInitContext';
import { FsProvider } from '../contexts/FsContext';
import { GitProvider } from '../contexts/GitContext';
import { NavigationProvider } from '../contexts/NavigationContext';
import { OpenspecProvider } from '../contexts/OpenspecContext';
import { PluginProvider } from '../contexts/PluginContext';
import { ProjectProvider } from '../contexts/ProjectContext';
import { SessionProvider } from '../contexts/SessionContext';
import { SocketProvider } from '../contexts/SocketContext';
import { createFakeSocketBrowser } from './fake-socket-browser';

export interface WorkspaceFixtures {
  sessions?: SessionStateSummary[];
  capabilities?: { worktree: boolean };
  settings?: Record<string, unknown>;
  className?: string;
}

/**
 * Seeds workspace state via a browser-compatible fake socket by intercepting
 * `app:init` before the SessionContext onConnect callback fires. Use when a
 * story needs projects/sessions/worktree state; for channel-only seeding
 * prefer `withStoryChannel` in `./story-decorator`.
 */
export function withStoryWorkspaceFixtures(
  fixtures: WorkspaceFixtures = {},
): (Story: () => React.ReactNode) => React.JSX.Element {
  const socket = createFakeSocketBrowser();

  socket.onServer(EVENTS.app.init, (...args: unknown[]) => {
    const cb = args[args.length - 1];
    if (typeof cb === 'function') {
      (cb as (...a: unknown[]) => void)({
        settings: fixtures.settings ?? {},
        sessions: fixtures.sessions ?? [],
        models: [],
        state: {
          platform: 'darwin',
          speechToTextEnabled: false,
          browserIntegrationSupported: false,
        },
        capabilities: fixtures.capabilities ?? { worktree: false },
      });
    }
  });

  const className = fixtures.className ?? 'h-screen flex flex-col bg-bg text-text overflow-hidden';

  return (Story: () => React.ReactNode) => (
    <SocketProvider socket={socket}>
      <AppInitProvider>
        <SessionProvider>
          <PluginProvider>
            <ProjectProvider>
              <NavigationProvider>
                <GitProvider>
                  <FsProvider>
                    <OpenspecProvider>
                      <div className={className}>
                        <Story />
                      </div>
                    </OpenspecProvider>
                  </FsProvider>
                </GitProvider>
              </NavigationProvider>
            </ProjectProvider>
          </PluginProvider>
        </SessionProvider>
      </AppInitProvider>
    </SocketProvider>
  );
}
