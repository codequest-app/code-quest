import type { FakeClaude } from '@code-quest/summoner/test';
import { segments as s } from '@code-quest/summoner/test';
import { act, type RenderResult, render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { ChannelProvider } from '../contexts/channel/ChannelContext';
import { PluginProvider } from '../contexts/PluginContext';
import { ProjectProvider } from '../contexts/ProjectContext';
import { SessionProvider } from '../contexts/SessionContext';
import { SocketProvider } from '../contexts/SocketContext';
import { TabProvider } from '../contexts/TabContext';
import { createFakeSummoner, type FakeSummoner } from './fake-summoner';

export interface RenderWithChannelOptions {
  channelId?: string;
  summoner?: FakeSummoner;
  initSegment?: string;
  /** Extra segments passed to claude.initialize (e.g. controlResponse). */
  extraSegments?: string[];
  cwd?: string;
  onNewChannel?: (cwd: string) => void;
  /** Skip claude.initialize — useful for testing launch failure. */
  skipInit?: boolean;
}

export interface RenderWithChannelResult extends RenderResult {
  claude: FakeClaude;
  summoner: FakeSummoner;
  channelId: string;
}

export async function renderWithChannel(
  ui: ReactElement,
  options: RenderWithChannelOptions = {},
): Promise<RenderWithChannelResult> {
  const summoner = options.summoner ?? createFakeSummoner();
  const claude = summoner.claude() as FakeClaude;
  const channelId = options.channelId ?? crypto.randomUUID();

  // 1. Render first — mount providers, register socket listeners (like production)
  const result = render(ui, {
    wrapper: ({ children }) => (
      <SocketProvider socket={summoner.socket}>
        <SessionProvider>
          <PluginProvider>
            <ProjectProvider>
              <TabProvider cwd={options.cwd}>
                <ChannelProvider
                  channelId={channelId}
                  cwd={options.cwd}
                  onNewChannel={options.onNewChannel}
                >
                  {children}
                </ChannelProvider>
              </TabProvider>
            </ProjectProvider>
          </PluginProvider>
        </SessionProvider>
      </SocketProvider>
    ),
  });

  // 2. Initialize after render — matches production flow (App renders, then session starts)
  if (!options.skipInit) {
    const initSeg = options.initSegment ?? s.init('cli-session');
    const extraSegs = options.extraSegments ?? [];
    await act(async () => {
      await claude.initialize({ launch: { channelId, cwd: options.cwd } }, initSeg, ...extraSegs);
    });
  }

  return { ...result, claude, summoner, channelId };
}
