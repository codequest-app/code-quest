/* biome-ignore-all lint/suspicious/noExplicitAny: test harness */

import type { FakeClaude } from '@code-quest/summoner/test';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkspaceLayout } from '../components/WorkspaceLayout';
import { PluginProvider } from '../contexts/PluginContext';
import { ProjectProvider } from '../contexts/ProjectContext';
import { SessionProvider } from '../contexts/SessionContext';
import { SocketProvider } from '../contexts/SocketContext';
import { createFakeSummoner, type FakeSummoner } from './fake-summoner';

interface RenderWithWorkspaceOptions {
  summoner?: FakeSummoner;
}

export interface RenderWithWorkspaceResult {
  claude: FakeClaude;
  summoner: FakeSummoner;
  user: ReturnType<typeof userEvent.setup>;
  addProject: (opts?: {
    path?: string;
    dirName?: string;
  }) => Promise<{ launchSession: () => Promise<string> }>;
}

/** Launch a new session (click "New tab" → await session init). */
async function launchSession(
  user: ReturnType<typeof userEvent.setup>,
  summoner: FakeSummoner,
): Promise<string> {
  let channelId = '';
  const initPromise = new Promise<string>((resolve) => {
    summoner.on('session:init', (p: any) => {
      if (!channelId) {
        channelId = p.channelId;
        resolve(p.channelId);
      }
    });
  });

  // Detect entry point: empty state "New Session" button or TabBar "+"
  const emptyButton = screen.queryByRole('button', { name: /New Session/ });
  if (emptyButton) {
    await user.click(emptyButton);
  } else {
    const newTabButtons = await screen.findAllByLabelText('New tab');
    await user.click(newTabButtons[newTabButtons.length - 1]);
  }

  await act(async () => {
    channelId = await initPromise;
  });

  await screen.findAllByPlaceholderText(/Esc to focus/i);

  return channelId;
}

/**
 * Add a project via AddProjectDialog UI flow.
 * Handles both entry points: EmptyState (no projects) and sidebar "+" (has projects).
 */
async function addProject(
  user: ReturnType<typeof userEvent.setup>,
  summoner: FakeSummoner,
  opts?: { path?: string; dirName?: string },
): Promise<{ launchSession: () => Promise<string> }> {
  const path = opts?.path ?? '/projects';
  const dirName = opts?.dirName ?? 'app';

  summoner.filesystem().setRoots([path]);
  summoner.filesystem().addDirectory(path, [dirName]);

  // Detect entry point: EmptyState or sidebar
  const emptyButton = screen.queryByTestId('empty-add-project');
  if (emptyButton) {
    await user.click(emptyButton);
  } else {
    const sidebar = screen.getByTestId('sidebar-panel');
    await user.click(within(sidebar).getByText(/Add/));
  }

  // Browse FileTree → select → Open
  const root = await screen.findByRole('treeitem', { name: path.split('/').pop() });
  await user.click(root);
  const item = await screen.findByRole('treeitem', { name: dirName });
  await user.click(item);
  await user.click(screen.getByText('Open'));

  return { launchSession: () => launchSession(user, summoner) };
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

  render(
    <SocketProvider socket={summoner.socket}>
      <SessionProvider>
        <PluginProvider>
          <ProjectProvider>
            <WorkspaceLayout />
          </ProjectProvider>
        </PluginProvider>
      </SessionProvider>
    </SocketProvider>,
  );

  return {
    claude,
    summoner,
    user,
    addProject: (projectOpts?: { path?: string; dirName?: string }) =>
      addProject(user, summoner, projectOpts),
  };
}
