/* biome-ignore-all lint/suspicious/noExplicitAny: test harness */

import type { FakeClaude } from '@code-quest/summoner/test';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkspaceLayout } from '../components/WorkspaceLayout';
import { config } from '../config';
import { PluginProvider } from '../contexts/PluginContext';
import { ProjectProvider } from '../contexts/ProjectContext';
import { SessionProvider } from '../contexts/SessionContext';
import { SocketProvider } from '../contexts/SocketContext';
import { createFakeSummoner, type FakeSummoner } from './fake-summoner';

export interface RenderWithWorkspaceOptions {
  summoner?: FakeSummoner;
}

export interface RenderWithWorkspaceResult {
  claude: FakeClaude;
  summoner: FakeSummoner;
  channelId: string;
  user: ReturnType<typeof userEvent.setup>;
}

export async function renderWithWorkspace(
  opts?: RenderWithWorkspaceOptions,
): Promise<RenderWithWorkspaceResult> {
  const summoner = opts?.summoner ?? createFakeSummoner();
  const claude = summoner.claude() as FakeClaude;
  const user = userEvent.setup({ pointerEventsCheck: 0 });

  if (!claude.hasInitSegments) {
    claude.prepareInit();
  }

  let channelId = '';
  const initPromise = new Promise<string>((resolve) => {
    summoner.on('session:init', (p: any) => {
      if (!channelId) {
        channelId = p.channelId;
        resolve(p.channelId);
      }
    });
  });

  render(
    <SocketProvider socket={summoner.socket}>
      <SessionProvider>
        <PluginProvider>
          <ProjectProvider>
            <WorkspaceLayout defaultCwd={config.defaultCwd} />
          </ProjectProvider>
        </PluginProvider>
      </SessionProvider>
    </SocketProvider>,
  );

  // Create project via EmptyState, then create tab
  await user.click(await screen.findByTestId('empty-new-session'));
  await user.click(await screen.findByLabelText('New tab'));

  await act(async () => {
    channelId = await initPromise;
  });

  await screen.findByPlaceholderText(/Esc to focus/i);

  return { claude, summoner, channelId, user };
}
