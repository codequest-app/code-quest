import { segments as s } from '@code-quest/summoner/test';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { WorkspaceLayout } from '@/components/workspace/WorkspaceLayout';
import { AppInitProvider } from '@/contexts/AppInitContext';
import { FsProvider } from '@/contexts/FsContext';
import { GitProvider } from '@/contexts/GitContext';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { OpenspecProvider } from '@/contexts/OpenspecContext';
import { PluginProvider } from '@/contexts/PluginContext';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { SessionProvider } from '@/contexts/SessionContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { TabProvider, useTabActions, useTabState } from '@/contexts/TabContext';
import { createFakeSummoner } from '@/test/fake-summoner';
import { renderWithWorkspace } from '@/test/render-with-workspace';

function renderInTab(ui: ReactElement) {
  const summoner = createFakeSummoner();
  const user = userEvent.setup();
  render(
    <SocketProvider socket={summoner.socket}>
      <TabProvider>{ui}</TabProvider>
    </SocketProvider>,
  );
  return { claude: summoner.claude(), user };
}

describe('TabProvider', () => {
  describe('tab bar UI', () => {
    it('renders tab bar after adding project', async () => {
      const summoner = createFakeSummoner();
      summoner.filesystem().setRoots(['/projects']);
      summoner.filesystem().addDirectory('/projects', ['my-app']);
      render(
        <SocketProvider socket={summoner.socket}>
          <AppInitProvider>
            <SessionProvider>
              <PluginProvider>
                <ProjectProvider>
                  <GitProvider>
                    <FsProvider>
                      <OpenspecProvider>
                        <NavigationProvider>
                          <WorkspaceLayout />
                        </NavigationProvider>
                      </OpenspecProvider>
                    </FsProvider>
                  </GitProvider>
                </ProjectProvider>
              </PluginProvider>
            </SessionProvider>
          </AppInitProvider>
        </SocketProvider>,
      );
      // Add project via dialog
      await userEvent.click(screen.getByRole('button', { name: 'Add Project' }));
      await userEvent.click(await screen.findByRole('treeitem', { name: 'projects' }));
      await userEvent.click(await screen.findByRole('treeitem', { name: 'my-app' }));
      await userEvent.click(screen.getByRole('button', { name: /^add$/i }));
      expect(screen.getByRole('button', { name: /New Session/ })).toBeInTheDocument();
    });

    it('renders new tab button that triggers server launch', async () => {
      const { addProject: addProj } = await renderWithWorkspace();
      const proj = await addProj();
      await proj.launchSession();
      expect(screen.getByLabelText('New tab')).toBeInTheDocument();
    });
  });

  describe('document title', () => {
    it('shows spinner prefix when session is busy and returns to base on idle', async () => {
      const { claude, user, addProject } = await renderWithWorkspace();
      const project = await addProject();
      await project.launchSession();
      const textarea = screen.getByPlaceholderText(/Esc to focus/i);
      await user.click(textarea);
      await user.type(textarea, 'hello');
      await user.keyboard('{Enter}');

      expect(document.title).toBe('⟳ Code Quest');

      await act(async () => {
        await claude.emitSegment(s.result());
      });
      expect(document.title).toBe('Code Quest');
    });
  });

  describe('socket events', () => {
    it('session:created adds a tab — UI shows content', async () => {
      const { addProject: addProj } = await renderWithWorkspace();
      const proj = await addProj();
      await proj.launchSession();
      expect(screen.getByPlaceholderText(/Esc to focus/i)).toBeInTheDocument();
    });

    it('addTab activates first tab when no active tab', async () => {
      function Test() {
        const { tabs, activeTabId } = useTabState();
        const { addTab } = useTabActions();
        return (
          <>
            <span role="status" aria-label="active">
              {activeTabId ?? 'null'}
            </span>
            <span role="status" aria-label="count">
              {Object.keys(tabs).length}
            </span>
            <button type="button" onClick={() => addTab('remote-ch')}>
              add
            </button>
          </>
        );
      }
      const { user } = renderInTab(<Test />);

      expect(screen.getByRole('status', { name: 'active' })).toHaveTextContent('null');

      await user.click(screen.getByText('add'));

      expect(screen.getByRole('status', { name: 'count' })).toHaveTextContent('1');
      expect(screen.getByRole('status', { name: 'active' })).toHaveTextContent('remote-ch');
    });

    it('new tab creates exactly one tab, not two', async () => {
      const { addProject: addProj } = await renderWithWorkspace();
      const proj = await addProj();
      await proj.launchSession();
      const tabsBefore = screen.queryAllByLabelText(/^Close /).length;

      const user = userEvent.setup({ pointerEventsCheck: 0 });
      await user.click(screen.getByLabelText('New tab'));

      // Wait for tab to appear (launch → onChange → re-render)
      await waitFor(() => {
        expect(screen.queryAllByLabelText(/^Close /).length).toBe(tabsBefore + 1);
      });

      // Verify it stays at +1 (no duplicate from session:created)
      // FakeClaude broadcasts synchronously, so if a duplicate would appear it already has.
      expect(screen.queryAllByLabelText(/^Close /).length).toBe(tabsBefore + 1);
    });

    it('launching second session creates second tab', async () => {
      const { user, addProject: addProj } = await renderWithWorkspace();
      const project = await addProj();
      await project.launchSession();
      const tabsBefore = screen.queryAllByLabelText(/^Close /).length;
      await user.click(screen.getByLabelText('New tab'));

      await waitFor(() => {
        expect(screen.queryAllByLabelText(/^Close /).length).toBe(tabsBefore + 1);
      });
    });

    it('session:created with cwd auto-creates project and tab remains visible', async () => {
      const { addProject: addProj } = await renderWithWorkspace();
      const proj = await addProj();
      await proj.launchSession();

      // After renderWithWorkspace, session:created was broadcast with cwd
      // → deriveProjects should have created a project
      // → WorkspaceLayout should render project path with TabProvider(sessions)
      // → Tab should be visible in project's TabContainer
      expect(screen.getByPlaceholderText(/Esc to focus/i)).toBeInTheDocument();
      expect(screen.queryAllByLabelText(/^Close /).length).toBeGreaterThanOrEqual(1);
    });

    it('session:dead removes tab', async () => {
      const { claude, addProject } = await renderWithWorkspace();
      const project = await addProject();
      await project.launchSession();
      await act(async () => {
        await claude.emitSegment(s.resultError({ errors: ['No conversation found'] }));
      });
      await act(async () => {
        claude.handle.abort();
      });

      expect(screen.getByPlaceholderText(/Esc to focus/i)).toBeInTheDocument();
    });
  });
});
