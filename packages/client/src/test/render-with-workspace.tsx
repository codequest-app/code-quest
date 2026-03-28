import { render, screen } from '@testing-library/react';
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
  user: ReturnType<typeof userEvent.setup>;
}

export async function renderWithWorkspace(
  opts?: RenderWithWorkspaceOptions,
): Promise<RenderWithWorkspaceResult> {
  const claude = opts?.claude ?? createFakeClaude();
  const user = userEvent.setup({ pointerEventsCheck: 0 });

  // Ensure auto-respond is ready if not already configured
  if (!claude.hasInitSegments) {
    claude.prepareInit();
  }

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

  return { claude, user };
}
