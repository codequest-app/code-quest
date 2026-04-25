import { EVENTS, type SessionStateSummary } from '@code-quest/shared';
import { useEffect, useState } from 'react';
import { AppInitProvider } from '../contexts/AppInitContext';
import { FsProvider } from '../contexts/FsContext';
import { GitProvider } from '../contexts/GitContext';
import { NavigationProvider } from '../contexts/NavigationContext';
import { OpenspecProvider } from '../contexts/OpenspecContext';
import { PluginProvider } from '../contexts/PluginContext';
import { ProjectProvider } from '../contexts/ProjectContext';
import { SessionProvider } from '../contexts/SessionContext';
import { SocketProvider } from '../contexts/SocketContext';
import { createFakeSummoner } from './fake-summoner';

export interface WorkspaceFixtures {
  sessions?: SessionStateSummary[];
  capabilities?: { worktree: boolean };
  settings?: Record<string, unknown>;
  className?: string;
}

// biome-ignore lint/suspicious/noExplicitAny: socket.emit has many overloads; the patch only inspects event name
type AnySocket = { emit: (event: string, ...args: any[]) => unknown };

/**
 * Seeds workspace state via a FakeSummoner-backed socket by intercepting
 * `app:init` before the SessionContext onConnect callback fires. Use when a
 * story needs projects/sessions/worktree state; for channel-only seeding
 * prefer `withStoryChannel` in `./story-decorator`.
 */
export function withStoryWorkspaceFixtures(fixtures: WorkspaceFixtures = {}) {
  return (Story: () => React.ReactNode) => {
    const [{ socket, summoner }] = useState(() => {
      const s = createFakeSummoner();
      const sock = s.socket as unknown as AnySocket;
      const originalEmit = sock.emit.bind(sock);
      sock.emit = (event, ...args) => {
        if (event === EVENTS.app.init) {
          const cb = args[args.length - 1];
          if (typeof cb === 'function') {
            cb({
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
          return sock;
        }
        return originalEmit(event, ...args);
      };
      return { socket: s.socket, summoner: s };
    });

    useEffect(() => () => summoner.disconnect(), [summoner]);

    const className =
      fixtures.className ?? 'h-screen flex flex-col bg-bg text-text overflow-hidden';

    return (
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
  };
}
