import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { PluginProvider } from '../../contexts/PluginContext';
import { ProjectProvider } from '../../contexts/ProjectContext';
import { SessionProvider } from '../../contexts/SessionContext';
import { SocketProvider } from '../../contexts/SocketContext';
import { usePreferencesStore } from '../../stores/usePreferencesStore';
import { createFakeSummoner } from '../../test/fake-summoner';
import { renderWithWorkspace } from '../../test/render-with-workspace';
import { WorkspaceLayout } from '../WorkspaceLayout';

describe('WorkspaceLayout', () => {
  beforeEach(() => {
    usePreferencesStore.setState({ isOnboardingDismissed: true });
  });

  it('renders a tab with ChatPanel inside', async () => {
    await renderWithWorkspace();

    expect(screen.getByPlaceholderText(/Esc to focus/i)).toBeInTheDocument();
  });

  it('renders two tabs with CSS show/hide', async () => {
    const { user } = await renderWithWorkspace();

    await user.click(screen.getByLabelText('New tab'));

    const closeButtons = screen.getAllByLabelText(/^Close /);
    expect(closeButtons).toHaveLength(2);
  });

  it('renders no panels when there are no tabs', () => {
    const { socket } = createFakeSummoner();
    render(
      <SocketProvider socket={socket}>
        <SessionProvider>
          <PluginProvider>
            <ProjectProvider>
              <WorkspaceLayout />
            </ProjectProvider>
          </PluginProvider>
        </SessionProvider>
      </SocketProvider>,
    );

    expect(screen.queryByPlaceholderText(/Esc to focus/i)).not.toBeInTheDocument();
  });

  it('renders TabBar above workspace panels', async () => {
    await renderWithWorkspace();

    expect(screen.getByTestId('tab-bar')).toBeInTheDocument();
  });

  it('renders ActivityBar with explorer icon', async () => {
    await renderWithWorkspace();

    expect(screen.getByTitle('Projects')).toBeInTheDocument();
  });

  it('toggles sidebar when clicking ActivityBar icon', async () => {
    await renderWithWorkspace();

    expect(screen.getByText(/Projects/i)).toBeInTheDocument();

    await userEvent.click(screen.getByTitle('Projects'));
    expect(screen.queryByTestId('sidebar-panel')).not.toBeInTheDocument();

    await userEvent.click(screen.getByTitle('Projects'));
    expect(screen.getByText(/Projects/i)).toBeInTheDocument();
  });

  it('sidebar shows project list by default', async () => {
    await renderWithWorkspace();

    expect(screen.getByText(/Projects/i)).toBeInTheDocument();
  });

  it('close tab removes tab from UI', async () => {
    const { user } = await renderWithWorkspace();

    // Create second tab
    await user.click(screen.getByLabelText('New tab'));
    const closeButtons = screen.getAllByLabelText(/^Close /);
    expect(closeButtons).toHaveLength(2);

    // Close second tab
    await user.click(closeButtons[1]);
    await user.click(screen.getByRole('button', { name: /close/i }));

    expect(screen.getAllByLabelText(/^Close /)).toHaveLength(1);
  });

  describe('multi-project', () => {
    it('second project creates separate tab group', async () => {
      const { user } = await renderWithWorkspace();

      // First tab is already in the default project
      expect(screen.getAllByLabelText(/^Close /).length).toBe(1);

      // Create second tab in same project
      await user.click(screen.getByLabelText('New tab'));
      expect(screen.getAllByLabelText(/^Close /).length).toBe(2);
    });

    it('renders per-project tabs when project has sessions', async () => {
      await renderWithWorkspace();

      expect(screen.getByPlaceholderText(/Esc to focus/i)).toBeInTheDocument();
      expect(screen.getAllByLabelText(/^Close /).length).toBe(1);
    });

    it('switching project keeps both tab groups mounted', async () => {
      const { summoner, claude, user } = await renderWithWorkspace();

      // First project created by renderWithWorkspace — set up filesystem for second
      summoner.filesystem().setRoots(['/projects']);
      summoner.filesystem().addDirectory('/projects', ['other-project']);

      // Open AddProjectDialog via sidebar
      const sidebar = screen.getByTestId('sidebar-panel');
      await user.click(within(sidebar).getByText(/Add/));

      // Expand root and select second project
      const root = await screen.findByRole('treeitem', { name: 'projects' });
      await user.click(root);
      const otherProject = await screen.findByRole('treeitem', { name: 'other-project' });
      await user.click(otherProject);
      await user.click(screen.getByText('Open'));

      // Second project created — switch to it in sidebar
      await user.click(within(sidebar).getByText(/other-project/));
      claude.prepareInit();
      const newTabButtons = screen.getAllByLabelText('New tab');
      // Click the visible one (active project's tab bar)
      await user.click(newTabButtons[newTabButtons.length - 1]);

      // Wait for second session to initialize
      await screen.findAllByPlaceholderText(/Esc to focus/i);

      // Both projects have ComposeInput rendered (one visible, one hidden)
      expect(screen.getAllByPlaceholderText(/Esc to focus/i).length).toBe(2);
    });
  });
});
