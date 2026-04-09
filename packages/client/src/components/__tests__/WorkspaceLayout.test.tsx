import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PluginProvider } from '../../contexts/PluginContext';
import { ProjectProvider, useProjectActions } from '../../contexts/ProjectContext';
import { SessionProvider } from '../../contexts/SessionContext';
import { SocketProvider } from '../../contexts/SocketContext';
import type { TabMeta } from '../../contexts/TabContext';
import { TabProvider } from '../../contexts/TabContext';
import { usePreferencesStore } from '../../stores/usePreferencesStore';
import { createFakeSummoner } from '../../test/fake-summoner';
import { SessionTabSync } from '../SessionTabSync';
import { WorkspaceLayout } from '../WorkspaceLayout';

vi.mock('../../contexts/channel', () => ({
  ChannelProvider: ({ channelId, children }: { channelId?: string; children: React.ReactNode }) => (
    <div data-channel-id={channelId ?? ''}>{children}</div>
  ),
}));

vi.mock('../ChatPanel', () => ({
  ChatPanel: () => <div data-testid="chat-panel" />,
}));

function renderLayout(opts?: { tabs?: Record<string, TabMeta>; activeTabId?: string | null }) {
  const { socket } = createFakeSummoner();
  const initialState = opts
    ? { tabs: opts.tabs ?? {}, activeTabId: opts.activeTabId ?? null }
    : undefined;
  return render(
    <SocketProvider socket={socket}>
      <SessionProvider>
        <PluginProvider>
          <ProjectProvider>
            <TabProvider initialState={initialState}>
              <WorkspaceLayout />
            </TabProvider>
          </ProjectProvider>
        </PluginProvider>
      </SessionProvider>
    </SocketProvider>,
  );
}

describe('WorkspaceLayout', () => {
  beforeEach(() => {
    usePreferencesStore.setState({ isOnboardingDismissed: true });
  });

  it('renders a ChannelProvider per tab with ChatPanel inside', () => {
    renderLayout({
      tabs: { 'sess-a': { tabStatus: 'idle' } },
      activeTabId: 'sess-a',
    });

    const panel = screen.getByTestId('chat-panel');
    expect(panel.parentElement).toHaveAttribute('data-channel-id', 'sess-a');
  });

  it('renders one ChannelProvider per tab with CSS show/hide', () => {
    renderLayout({
      tabs: {
        'sess-a': { tabStatus: 'idle' },
        'sess-b': { tabStatus: 'idle' },
      },
      activeTabId: 'sess-a',
    });

    const providers = screen.getAllByTestId('chat-panel');
    expect(providers).toHaveLength(2);

    const sessA = providers.find(
      (el) => el.parentElement?.getAttribute('data-channel-id') === 'sess-a',
    );
    const sessB = providers.find(
      (el) => el.parentElement?.getAttribute('data-channel-id') === 'sess-b',
    );
    expect(sessA?.closest('[data-channel-id]')?.parentElement).not.toHaveClass('hidden');
    expect(sessB?.closest('[data-channel-id]')?.parentElement).toHaveClass('hidden');
  });

  it('renders no panels when there are no tabs', () => {
    renderLayout();

    expect(screen.queryByTestId('chat-panel')).not.toBeInTheDocument();
  });

  it('renders TabBar above workspace panels', () => {
    renderLayout({
      tabs: { 'sess-a': { tabStatus: 'idle' } },
      activeTabId: 'sess-a',
    });

    expect(screen.getByTestId('tab-bar')).toBeInTheDocument();
  });

  it('renders ActivityBar with explorer icon', () => {
    renderLayout({
      tabs: { 'sess-a': { tabStatus: 'idle' } },
      activeTabId: 'sess-a',
    });

    expect(screen.getByTitle('Projects')).toBeInTheDocument();
  });

  it('toggles sidebar when clicking ActivityBar icon', async () => {
    renderLayout({
      tabs: { 'sess-a': { tabStatus: 'idle' } },
      activeTabId: 'sess-a',
    });

    // Sidebar starts open with Projects panel
    expect(screen.getByText(/Projects/i)).toBeInTheDocument();

    // Click Projects icon → sidebar closes
    await userEvent.click(screen.getByTitle('Projects'));
    expect(screen.queryByTestId('sidebar-panel')).not.toBeInTheDocument();

    // Click again → sidebar reopens
    await userEvent.click(screen.getByTitle('Projects'));
    expect(screen.getByText(/Projects/i)).toBeInTheDocument();
  });

  it('sidebar shows project list by default', () => {
    renderLayout({
      tabs: { 'sess-a': { tabStatus: 'idle' } },
      activeTabId: 'sess-a',
    });

    // Sidebar starts open with project list
    expect(screen.getByText(/Projects/i)).toBeInTheDocument();
  });

  it('close tab removes tab from UI', async () => {
    renderLayout({
      tabs: {
        'sess-a': { tabStatus: 'idle' },
        'sess-b': { tabStatus: 'idle' },
      },
      activeTabId: 'sess-a',
    });

    await userEvent.click(screen.getByLabelText('Close sess-b'));
    await userEvent.click(screen.getByRole('button', { name: /close/i }));

    expect(screen.queryByLabelText('Close sess-b')).not.toBeInTheDocument();
  });

  describe('per-project TabProvider', () => {
    function AddProjectButton({ cwd }: { cwd: string }) {
      const { addProject } = useProjectActions();
      return (
        <button type="button" data-testid={`add-${cwd}`} onClick={() => addProject(cwd)}>
          add {cwd}
        </button>
      );
    }

    function renderWithProjects() {
      const summoner = createFakeSummoner();
      return {
        ...render(
          <SocketProvider socket={summoner.socket}>
            <SessionProvider>
              <PluginProvider>
                <ProjectProvider>
                  <TabProvider>
                    <SessionTabSync />
                    <AddProjectButton cwd="/project-a" />
                    <AddProjectButton cwd="/project-b" />
                    <WorkspaceLayout />
                  </TabProvider>
                </ProjectProvider>
              </PluginProvider>
            </SessionProvider>
          </SocketProvider>,
        ),
        summoner,
      };
    }

    async function emitFromServer(
      summoner: ReturnType<typeof createFakeSummoner>,
      event: string,
      payload: unknown,
    ) {
      await act(async () => {
        summoner.socket.serverSocket.emit(event, payload);
        // Wait for microtask (serverSocket.emit) + useEffect flush
        await new Promise((r) => setTimeout(r, 10));
      });
      // Extra flush for cascading state updates (ProjectProvider → SessionTabSync → TabProvider)
      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });
    }

    it('renders per-project tabs when project has sessions', async () => {
      const { summoner } = renderWithProjects();

      await userEvent.click(screen.getByTestId('add-/project-a'));
      await emitFromServer(summoner, 'session:created', { channelId: 'sess-a', cwd: '/project-a' });

      const panel = await screen.findByTestId('chat-panel');
      expect(panel.parentElement).toHaveAttribute('data-channel-id', 'sess-a');
    });

    it('switching project keeps both tab groups mounted', async () => {
      const { summoner } = renderWithProjects();

      await userEvent.click(screen.getByTestId('add-/project-a'));
      await userEvent.click(screen.getByTestId('add-/project-b'));
      await emitFromServer(summoner, 'session:created', { channelId: 'sess-a', cwd: '/project-a' });
      await emitFromServer(summoner, 'session:created', { channelId: 'sess-b', cwd: '/project-b' });

      // Wait for both per-project TabProviders to render chat panels
      await vi.waitFor(() => {
        expect(screen.getAllByTestId('chat-panel')).toHaveLength(2);
      });

      // Switch to project-a
      const sidebar = screen.getByTestId('sidebar-panel');
      await userEvent.click(within(sidebar).getByText(/project-a/));

      // Both still mounted
      expect(screen.getAllByTestId('chat-panel')).toHaveLength(2);

      // project-a visible, project-b hidden
      const panelsAfter = screen.getAllByTestId('chat-panel');
      const sessA = panelsAfter.find(
        (el) => el.parentElement?.getAttribute('data-channel-id') === 'sess-a',
      );
      expect(sessA?.closest('[data-channel-id]')?.parentElement).not.toHaveClass('hidden');
    });
  });
});
