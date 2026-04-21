/**
 * Workspace fixture decorator for Storybook.
 *
 * Seeds the Socket layer so `SessionContext` / `ProjectContext` pick up the
 * desired workspace state on first render. Unlike `withStoryChannel` (which
 * only injects channel-level state via provider props), this decorator goes
 * through the socket path — matching how the real app receives data and
 * avoiding the prop-based initial-state pattern that was deliberately removed
 * from production providers.
 *
 * Use this when a story needs:
 *   - seeded projects / sessions (derived from sessions)
 *   - worktree capability
 *   - the full app shell shape (ActivityBar + sidebar + TabBar + chat)
 *
 * If you only need channel messages in isolation, prefer `withStoryChannel`
 * in `./story-decorator`.
 */

import { EVENTS, type SessionStateSummary } from '@code-quest/shared';
import { useMemo } from 'react';
import { PluginProvider } from '../contexts/PluginContext';
import { ProjectProvider } from '../contexts/ProjectContext';
import { SessionProvider } from '../contexts/SessionContext';
import { SocketProvider } from '../contexts/SocketContext';
import { WorktreeProvider } from '../contexts/WorktreeContext';
import { createFakeSummoner } from './fake-summoner';

export interface WorkspaceFixtures {
  /** Seeded session list — projects are derived from these. */
  sessions?: SessionStateSummary[];
  /** Server capabilities (e.g. `{ worktree: true }`). Default: `{ worktree: false }`. */
  capabilities?: { worktree: boolean };
  /** Initial settings returned by `app:init` (model, permissionMode, etc.). */
  settings?: Record<string, unknown>;
  /** Wrapper className — defaults to fullscreen shell sizing. */
  className?: string;
}

/**
 * Decorator that seeds workspace-level state via a FakeSummoner-backed socket.
 *
 * @example
 *   decorators: [withStoryWorkspaceFixtures({ sessions: [makeSession()] })]
 */
export function withStoryWorkspaceFixtures(fixtures: WorkspaceFixtures = {}) {
  return (Story: () => React.ReactNode) => {
    const { socket } = useMemo(() => {
      const summoner = createFakeSummoner();
      const s = summoner.socket;

      // Intercept `app:init` so SessionContext receives our seeded response
      // synchronously during its onConnect callback — no empty→seeded flash.
      // biome-ignore lint/suspicious/noExplicitAny: socket.emit has multiple overloads
      const originalEmit = s.emit.bind(s) as any;
      // biome-ignore lint/suspicious/noExplicitAny: narrow internal patch
      (s as any).emit = (event: string, ...args: unknown[]) => {
        if (event === EVENTS.app.init) {
          const cb = args[args.length - 1];
          if (typeof cb === 'function') {
            (cb as (raw: unknown) => void)({
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
          return s;
        }
        return originalEmit(event, ...args);
      };
      return { socket: s };
    }, []); // fixtures captured once per story mount; decorator recreates on story change

    const className =
      fixtures.className ?? 'h-screen flex flex-col bg-bg text-text overflow-hidden';

    return (
      <SocketProvider socket={socket}>
        <SessionProvider>
          <PluginProvider>
            <ProjectProvider>
              <WorktreeProvider>
                <div className={className}>
                  <Story />
                </div>
              </WorktreeProvider>
            </ProjectProvider>
          </PluginProvider>
        </SessionProvider>
      </SocketProvider>
    );
  };
}
