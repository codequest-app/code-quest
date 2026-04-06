import { segments as s } from '@code-quest/summoner/test';
import { act, type RenderResult, render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { ChannelProvider } from '../contexts/channel/ChannelContext';
import { PluginProvider } from '../contexts/PluginContext';
import { SessionProvider } from '../contexts/SessionContext';
import { SocketProvider } from '../contexts/SocketContext';
import { TabProvider } from '../contexts/TabContext';
import { createFakeClaude, type FakeClaude } from './fake-claude';

export interface RenderWithChannelOptions {
  channelId?: string;
  claude?: FakeClaude;
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
  channelId: string;
}

export async function renderWithChannel(
  ui: ReactElement,
  options: RenderWithChannelOptions = {},
): Promise<RenderWithChannelResult> {
  const { claude: externalClaude } = options;
  const claude = externalClaude ?? createFakeClaude();
  const channelId = options.channelId ?? crypto.randomUUID();

  // 1. Render first — mount providers, register socket listeners (like production)
  const result = render(ui, {
    wrapper: ({ children }) => (
      <SocketProvider socket={claude.socket}>
        <SessionProvider>
          <PluginProvider>
            <TabProvider>
              <ChannelProvider
                channelId={channelId}
                cwd={options.cwd}
                onNewChannel={options.onNewChannel}
              >
                {children}
              </ChannelProvider>
            </TabProvider>
          </PluginProvider>
        </SessionProvider>
      </SocketProvider>
    ),
  });

  // 2. Then launch — session:init arrives after listeners are registered (like production)
  if (!options.skipInit) {
    const initSeg = options.initSegment ?? s.init('test-sess');
    await act(async () => {
      await claude.initialize(initSeg, ...(options.extraSegments ?? []), { launch: { channelId } });
    });
  }

  return { ...result, claude, channelId };
}
