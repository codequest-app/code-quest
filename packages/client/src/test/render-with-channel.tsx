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
  cwd?: string;
  onWorktree?: (info: { name: string; path: string }) => void;
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
                onWorktree={options.onWorktree}
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
  await act(async () => {
    await claude.initialize(s.init('test-sess'), { launch: { channelId } });
  });

  return { ...result, claude, channelId };
}
