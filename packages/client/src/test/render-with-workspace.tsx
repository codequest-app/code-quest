import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkspaceLayout } from '../components/WorkspaceLayout';
import { PluginProvider } from '../contexts/PluginContext';
import { SessionProvider } from '../contexts/SessionContext';
import { SocketProvider } from '../contexts/SocketContext';
import { TabProvider } from '../contexts/TabContext';
import { createFakeClaude, type FakeClaude } from './fake-claude';

export interface RenderWithWorkspaceOptions {
  claude?: FakeClaude;
}

export interface RenderWithWorkspaceResult {
  claude: FakeClaude;
  channelId: string;
  user: ReturnType<typeof userEvent.setup>;
}

export async function renderWithWorkspace(
  opts?: RenderWithWorkspaceOptions,
): Promise<RenderWithWorkspaceResult> {
  const claude = opts?.claude ?? createFakeClaude();
  const user = userEvent.setup({ pointerEventsCheck: 0 });

  if (!claude.hasInitSegments) {
    claude.prepareInit();
  }

  // Capture channelId from session:init (fires after launch + join)
  let channelId = '';
  const initPromise = new Promise<string>((resolve) => {
    claude.socket.on('session:init', (p) => {
      if (!channelId) {
        channelId = p.channelId;
        resolve(p.channelId);
      }
    });
  });

  render(
    <SocketProvider socket={claude.socket}>
      <SessionProvider>
        <PluginProvider>
          <TabProvider>
            <WorkspaceLayout />
          </TabProvider>
        </PluginProvider>
      </SessionProvider>
    </SocketProvider>,
  );

  await user.click(await screen.findByLabelText('New tab'));

  // Wait for full launch → join → session:init cycle
  await act(async () => {
    channelId = await initPromise;
  });

  // Ensure channel is fully joined and UI rendered
  await screen.findByPlaceholderText(/Esc to focus/i);

  return { claude, channelId, user };
}
