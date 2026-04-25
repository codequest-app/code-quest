import type { FakeClaude } from '@code-quest/summoner/test';
import { segments as s } from '@code-quest/summoner/test';
import { act, type RenderResult, render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { AppInitProvider } from '../contexts/AppInitContext';
import { ChannelProvider } from '../contexts/channel/ChannelContext';
import { NavigationProvider } from '../contexts/NavigationContext';
import { PluginProvider } from '../contexts/PluginContext';
import { ProjectProvider } from '../contexts/ProjectContext';
import { SessionProvider } from '../contexts/SessionContext';
import { SocketProvider } from '../contexts/SocketContext';
import { TabProvider } from '../contexts/TabContext';
import { createFakeSummoner, type FakeSummoner } from './fake-summoner';

interface RenderWithChannelOptions {
  channelId?: string;
  summoner?: FakeSummoner;
  initSegment?: string;
  /** Extra segments passed to claude.initialize (e.g. controlResponse). */
  extraSegments?: string[];
  cwd?: string;
  onNewChannel?: (cwd: string) => void;
  /** Skip claude.initialize — useful for testing launch failure. */
  skipInit?: boolean;
  /** Forces the underlying ChannelProvider's `launchOnMount` prop.
   *  Default: false — children render immediately without a React-driven
   *  spawn. Tests that want React to drive `session:launch` must set this
   *  explicitly (typically alongside `cwd` and `skipInit: true`). */
  launchOnMount?: boolean;
}

interface RenderWithChannelResult extends RenderResult {
  claude: FakeClaude;
  summoner: FakeSummoner;
  channelId: string;
}

const DEFAULT_TEST_CWD = '/test/cwd';

export async function renderWithChannel(
  ui: ReactElement,
  options: RenderWithChannelOptions = {},
): Promise<RenderWithChannelResult> {
  const summoner = options.summoner ?? createFakeSummoner();
  const claude = summoner.claude() as FakeClaude;
  const channelId = options.channelId ?? crypto.randomUUID();
  // Used only for the launch-payload default. ChannelProvider keeps
  // options.cwd (undefined skips the React-side session:launch).
  const launchCwd = options.cwd ?? DEFAULT_TEST_CWD;

  // 1. Render first — mount providers, register socket listeners (like production)
  const result = render(ui, {
    wrapper: ({ children }) => (
      <SocketProvider socket={summoner.socket}>
        <AppInitProvider>
          <SessionProvider>
            <PluginProvider>
              <ProjectProvider>
                <NavigationProvider>
                  <TabProvider cwd={options.cwd}>
                    <ChannelProvider
                      channelId={channelId}
                      cwd={options.cwd}
                      launchOnMount={options.launchOnMount ?? false}
                      onNewChannel={options.onNewChannel}
                    >
                      {children}
                    </ChannelProvider>
                  </TabProvider>
                </NavigationProvider>
              </ProjectProvider>
            </PluginProvider>
          </SessionProvider>
        </AppInitProvider>
      </SocketProvider>
    ),
  });

  // 2. Initialize after render — matches production flow (App renders, then session starts)
  if (!options.skipInit) {
    const initSeg = options.initSegment ?? s.init('cli-session');
    const extraSegs = options.extraSegments ?? [];
    await act(async () => {
      await claude.initialize({ launch: { channelId, cwd: launchCwd } }, initSeg, ...extraSegs);
    });
  }

  return { ...result, claude, summoner, channelId };
}
