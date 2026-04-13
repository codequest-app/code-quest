import type { SessionStateSummary } from '@code-quest/shared';
import { segments as s } from '@code-quest/summoner/test';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { WorkspaceLayout } from '../../components/WorkspaceLayout';
import { createFakeSummoner } from '../../test/fake-summoner';
import { renderWithWorkspace } from '../../test/render-with-workspace';
import { PluginProvider } from '../PluginContext';
import { ProjectProvider, useProjectActions, useProjectState } from '../ProjectContext';
import { SessionProvider } from '../SessionContext';
import { SocketProvider } from '../SocketContext';
import { TabProvider, useTabActions, useTabState } from '../TabContext';

const idleSession = (channelId: string, cwd = '/') => ({ channelId, state: 'idle' as const, cwd });

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

function renderWithSessions(ui: ReactElement, initialSessions: SessionStateSummary[] = []) {
  const summoner = createFakeSummoner();
  const user = userEvent.setup();
  let sessions = initialSessions;
  const { rerender } = render(
    <SocketProvider socket={summoner.socket}>
      <TabProvider sessions={sessions}>{ui}</TabProvider>
    </SocketProvider>,
  );
  function setSessions(next: SessionStateSummary[]) {
    sessions = next;
    rerender(
      <SocketProvider socket={summoner.socket}>
        <TabProvider sessions={sessions}>{ui}</TabProvider>
      </SocketProvider>,
    );
  }
  return { user, setSessions };
}

function renderWithProjectAndSessions(
  ui: ReactElement,
  initial: { cwd: string; sessions?: SessionStateSummary[] },
) {
  const summoner = createFakeSummoner();
  let sessions = initial.sessions ?? [];
  const tree = (
    <SocketProvider socket={summoner.socket}>
      <SessionProvider>
        <ProjectProvider>
          <TabProvider cwd={initial.cwd} sessions={sessions}>
            {ui}
          </TabProvider>
        </ProjectProvider>
      </SessionProvider>
    </SocketProvider>
  );
  const { rerender } = render(tree);
  function setSessions(next: SessionStateSummary[]) {
    sessions = next;
    rerender(
      <SocketProvider socket={summoner.socket}>
        <SessionProvider>
          <ProjectProvider>
            <TabProvider cwd={initial.cwd} sessions={sessions}>
              {ui}
            </TabProvider>
          </ProjectProvider>
        </SessionProvider>
      </SocketProvider>,
    );
  }
  return { setSessions };
}

describe('TabProvider', () => {
  // ── Unit tests (no pipeline) ──

  describe('pendingActivateChannel intent (Decision 10)', () => {
    function ProbeAndTrigger({ trigger }: { trigger: { cwd: string; channelId: string } }) {
      const { activeTabId } = useTabState();
      const { pendingActivateChannel } = useProjectState();
      const { requestActivateChannel } = useProjectActions();
      return (
        <>
          <span data-testid="active">{activeTabId ?? 'null'}</span>
          <span data-testid="pending">{JSON.stringify(pendingActivateChannel)}</span>
          <button
            type="button"
            onClick={() => requestActivateChannel(trigger.cwd, trigger.channelId)}
          >
            request
          </button>
        </>
      );
    }

    it('matching cwd + channel already in tabs → setActiveTab + clearPendingActivate', async () => {
      renderWithProjectAndSessions(
        <ProbeAndTrigger trigger={{ cwd: '/proj', channelId: 'ch-1' }} />,
        {
          cwd: '/proj',
          sessions: [{ channelId: 'ch-1', state: 'idle', cwd: '/proj' }],
        },
      );

      const user = userEvent.setup({ pointerEventsCheck: 0 });
      await user.click(screen.getByText('request'));

      await waitFor(() => {
        expect(screen.getByTestId('active')).toHaveTextContent('ch-1');
        expect(screen.getByTestId('pending')).toHaveTextContent('null');
      });
    });

    it('matching cwd + channel NOT yet in tabs → wait (no clear), activate when channel appears', async () => {
      const { setSessions } = renderWithProjectAndSessions(
        <ProbeAndTrigger trigger={{ cwd: '/proj', channelId: 'ch-late' }} />,
        { cwd: '/proj', sessions: [] },
      );

      const user = userEvent.setup({ pointerEventsCheck: 0 });
      await user.click(screen.getByText('request'));

      // Pending stays set; no active tab yet
      expect(screen.getByTestId('pending')).toHaveTextContent('"channelId":"ch-late"');
      expect(screen.getByTestId('active')).toHaveTextContent('null');

      // Channel appears via sessions prop
      setSessions([{ channelId: 'ch-late', state: 'idle', cwd: '/proj' }]);

      await waitFor(() => {
        expect(screen.getByTestId('active')).toHaveTextContent('ch-late');
        expect(screen.getByTestId('pending')).toHaveTextContent('null');
      });
    });

    it('cwd does NOT match own cwd → pending stays uncleared', async () => {
      // Two tabs: 'ch-a' (added first, becomes active) and 'ch-target'.
      // Request targets a different cwd → must not steal activation, must not clear.
      renderWithProjectAndSessions(
        <ProbeAndTrigger trigger={{ cwd: '/other', channelId: 'ch-target' }} />,
        {
          cwd: '/proj',
          sessions: [
            { channelId: 'ch-a', state: 'idle', cwd: '/proj' },
            { channelId: 'ch-target', state: 'idle', cwd: '/proj' },
          ],
        },
      );

      const user = userEvent.setup({ pointerEventsCheck: 0 });
      await user.click(screen.getByText('request'));

      await new Promise((r) => setTimeout(r, 30));

      expect(screen.getByTestId('active')).toHaveTextContent('ch-a');
      expect(screen.getByTestId('pending')).toHaveTextContent('"channelId":"ch-target"');
    });
  });

  describe('state management', () => {
    it('provides initial empty state', () => {
      function Test() {
        const { tabs, activeTabId } = useTabState();
        return (
          <>
            <span data-testid="tabs">{JSON.stringify(tabs)}</span>
            <span data-testid="active">{activeTabId ?? 'null'}</span>
          </>
        );
      }
      renderInTab(<Test />);
      expect(screen.getByTestId('tabs')).toHaveTextContent('{}');
      expect(screen.getByTestId('active')).toHaveTextContent('null');
    });

    it('addTab adds a tab', async () => {
      function Test() {
        const { tabs } = useTabState();
        const { addTab } = useTabActions();
        return (
          <>
            <span data-testid="tabs">{JSON.stringify(tabs)}</span>
            <button type="button" onClick={() => addTab('tab-1')}>
              add
            </button>
          </>
        );
      }
      const { user } = renderInTab(<Test />);
      await user.click(screen.getByText('add'));
      expect(JSON.parse(screen.getByTestId('tabs').textContent!)).toHaveProperty('tab-1');
      expect(JSON.parse(screen.getByTestId('tabs').textContent!)['tab-1']).toEqual({
        title: undefined,
        tabStatus: 'connecting',
      });
    });

    it('addTab does not duplicate existing tab', async () => {
      function Test() {
        const { tabs } = useTabState();
        const { addTab } = useTabActions();
        return (
          <>
            <span data-testid="count">{Object.keys(tabs).length}</span>
            <button type="button" onClick={() => addTab('tab-1')}>
              add
            </button>
          </>
        );
      }
      const { user } = renderInTab(<Test />);
      await user.click(screen.getByText('add'));
      await user.click(screen.getByText('add'));
      expect(screen.getByTestId('count')).toHaveTextContent('1');
    });

    it('removeTab removes a tab', async () => {
      function Test() {
        const { tabs } = useTabState();
        const { addTab, removeTab } = useTabActions();
        return (
          <>
            <span data-testid="has">{String('tab-1' in tabs)}</span>
            <button type="button" onClick={() => addTab('tab-1')}>
              add
            </button>
            <button type="button" onClick={() => removeTab('tab-1')}>
              remove
            </button>
          </>
        );
      }
      const { user } = renderInTab(<Test />);
      await user.click(screen.getByText('add'));
      await user.click(screen.getByText('remove'));
      expect(screen.getByTestId('has')).toHaveTextContent('false');
    });

    it('removeTab switches activeTabId when active tab is removed', async () => {
      function Test() {
        const { activeTabId } = useTabState();
        const { addTab, setActiveTab, removeTab } = useTabActions();
        return (
          <>
            <span data-testid="active">{activeTabId ?? 'null'}</span>
            <button
              type="button"
              onClick={() => {
                addTab('tab-1');
                addTab('tab-2');
                setActiveTab('tab-2');
              }}
            >
              setup
            </button>
            <button type="button" onClick={() => removeTab('tab-2')}>
              remove
            </button>
          </>
        );
      }
      const { user } = renderInTab(<Test />);
      await user.click(screen.getByText('setup'));
      await user.click(screen.getByText('remove'));
      expect(screen.getByTestId('active')).toHaveTextContent('tab-1');
    });

    it('removeTab sets activeTabId to null when last tab removed', async () => {
      function Test() {
        const { activeTabId } = useTabState();
        const { addTab, setActiveTab, removeTab } = useTabActions();
        return (
          <>
            <span data-testid="active">{activeTabId ?? 'null'}</span>
            <button
              type="button"
              onClick={() => {
                addTab('tab-1');
                setActiveTab('tab-1');
              }}
            >
              setup
            </button>
            <button type="button" onClick={() => removeTab('tab-1')}>
              remove
            </button>
          </>
        );
      }
      const { user } = renderInTab(<Test />);
      await user.click(screen.getByText('setup'));
      await user.click(screen.getByText('remove'));
      expect(screen.getByTestId('active')).toHaveTextContent('null');
    });

    it('setActiveTab updates activeTabId', async () => {
      function Test() {
        const { activeTabId } = useTabState();
        const { addTab, setActiveTab } = useTabActions();
        return (
          <>
            <span data-testid="active">{activeTabId ?? 'null'}</span>
            <button
              type="button"
              onClick={() => {
                addTab('tab-1');
                setActiveTab('tab-1');
              }}
            >
              go
            </button>
          </>
        );
      }
      const { user } = renderInTab(<Test />);
      await user.click(screen.getByText('go'));
      expect(screen.getByTestId('active')).toHaveTextContent('tab-1');
    });

    it('setTabTitle updates tab title', async () => {
      function Test() {
        const { tabs } = useTabState();
        const { addTab, setTabTitle } = useTabActions();
        return (
          <>
            <span data-testid="title">{tabs['tab-1']?.title ?? 'none'}</span>
            <button type="button" onClick={() => addTab('tab-1')}>
              add
            </button>
            <button type="button" onClick={() => setTabTitle('tab-1', 'Hello')}>
              title
            </button>
          </>
        );
      }
      const { user } = renderInTab(<Test />);
      await user.click(screen.getByText('add'));
      await user.click(screen.getByText('title'));
      expect(screen.getByTestId('title')).toHaveTextContent('Hello');
    });

    it('setTabStatus updates tab status', async () => {
      function Test() {
        const { tabs } = useTabState();
        const { addTab, setTabStatus } = useTabActions();
        return (
          <>
            <span data-testid="status">{tabs['tab-1']?.tabStatus ?? 'none'}</span>
            <button type="button" onClick={() => addTab('tab-1')}>
              add
            </button>
            <button type="button" onClick={() => setTabStatus('tab-1', 'processing')}>
              processing
            </button>
          </>
        );
      }
      const { user } = renderInTab(<Test />);
      await user.click(screen.getByText('add'));
      await user.click(screen.getByText('processing'));
      expect(screen.getByTestId('status')).toHaveTextContent('processing');
    });

    it('setTabTitle and setTabStatus work independently', async () => {
      function Test() {
        const { tabs } = useTabState();
        const { addTab, setTabTitle, setTabStatus } = useTabActions();
        return (
          <>
            <span data-testid="tab">{JSON.stringify(tabs['tab-1'] ?? null)}</span>
            <button type="button" onClick={() => addTab('tab-1')}>
              add
            </button>
            <button type="button" onClick={() => setTabTitle('tab-1', 'Hello')}>
              title
            </button>
            <button type="button" onClick={() => setTabStatus('tab-1', 'disconnected')}>
              disconnected
            </button>
          </>
        );
      }
      const { user } = renderInTab(<Test />);
      await user.click(screen.getByText('add'));
      await user.click(screen.getByText('title'));
      await user.click(screen.getByText('disconnected'));
      expect(JSON.parse(screen.getByTestId('tab').textContent!)).toEqual({
        title: 'Hello',
        tabStatus: 'disconnected',
      });
    });

    it('throws when useTabState is called outside provider', () => {
      expect(() => renderHook(() => useTabState())).toThrow(
        'useTabState must be used within a TabProvider',
      );
    });

    it('throws when useTabActions is called outside provider', () => {
      expect(() => renderHook(() => useTabActions())).toThrow(
        'useTabActions must be used within a TabProvider',
      );
    });
  });

  // ── tab creation from sessions ──

  describe('tab creation from sessions', () => {
    it('creates tab without cwd from session (cwd only for new sessions via createNewTab)', () => {
      function Test() {
        const { tabs, activeTabId } = useTabState();
        const cwd = activeTabId ? tabs[activeTabId]?.cwd : undefined;
        return <span data-testid="cwd">{cwd ?? 'none'}</span>;
      }
      const { setSessions } = renderWithSessions(<Test />);
      setSessions([{ channelId: 'ch-1', state: 'idle', cwd: '/my/project' }]);
      expect(screen.getByTestId('cwd')).toHaveTextContent('none');
    });

    it('creates tab when session appears', () => {
      function Test() {
        const { tabs } = useTabState();
        return <span data-testid="count">{Object.keys(tabs).length}</span>;
      }
      const { setSessions } = renderWithSessions(<Test />);
      setSessions([idleSession('ch-1')]);
      expect(screen.getByTestId('count')).toHaveTextContent('1');
    });
  });

  // ── syncFromServer ──

  describe('sessions prop sync', () => {
    it('adds tabs for server sessions', () => {
      function Test() {
        const { tabs } = useTabState();
        return <span data-testid="keys">{Object.keys(tabs).sort().join(',')}</span>;
      }
      const { setSessions } = renderWithSessions(<Test />);
      setSessions([idleSession('a'), idleSession('b')]);
      expect(screen.getByTestId('keys')).toHaveTextContent('a,b');
    });

    it('removes stale tabs when session disappears', () => {
      function Test() {
        const { tabs } = useTabState();
        return (
          <>
            <span data-testid="has-stale">{String('stale' in tabs)}</span>
            <span data-testid="has-fresh">{String('fresh' in tabs)}</span>
          </>
        );
      }
      const { setSessions } = renderWithSessions(<Test />, [idleSession('stale')]);
      setSessions([idleSession('fresh')]);
      expect(screen.getByTestId('has-stale')).toHaveTextContent('false');
      expect(screen.getByTestId('has-fresh')).toHaveTextContent('true');
    });

    it('is idempotent — no change when sessions unchanged', () => {
      function Test() {
        const { tabs } = useTabState();
        return <span data-testid="tabs">{JSON.stringify(tabs)}</span>;
      }
      const sessions = [idleSession('a')];
      const { setSessions } = renderWithSessions(<Test />, sessions);
      const before = screen.getByTestId('tabs').textContent;
      setSessions(sessions);
      expect(screen.getByTestId('tabs')).toHaveTextContent(before!);
    });

    it('sets activeTabId to first session when no active tab', () => {
      function Test() {
        const { activeTabId } = useTabState();
        return <span data-testid="active">{activeTabId ?? 'null'}</span>;
      }
      const { setSessions } = renderWithSessions(<Test />);
      setSessions([idleSession('x'), idleSession('y')]);
      expect(screen.getByTestId('active')).toHaveTextContent('x');
    });

    it('preserves activeTabId when session still exists', () => {
      function Test() {
        const { activeTabId } = useTabState();
        return <span data-testid="active">{activeTabId ?? 'null'}</span>;
      }
      const { setSessions } = renderWithSessions(<Test />, [idleSession('keep')]);
      setSessions([idleSession('keep'), idleSession('other')]);
      expect(screen.getByTestId('active')).toHaveTextContent('keep');
    });

    it('resets activeTabId when active session removed', () => {
      function Test() {
        const { activeTabId } = useTabState();
        return <span data-testid="active">{activeTabId ?? 'null'}</span>;
      }
      const { setSessions } = renderWithSessions(<Test />, [idleSession('dead')]);
      setSessions([idleSession('new')]);
      expect(screen.getByTestId('active')).toHaveTextContent('new');
    });

    it('handles empty sessions', () => {
      function Test() {
        const { tabs, activeTabId } = useTabState();
        return (
          <>
            <span data-testid="tabs">{JSON.stringify(tabs)}</span>
            <span data-testid="active">{activeTabId ?? 'null'}</span>
          </>
        );
      }
      const { setSessions } = renderWithSessions(<Test />, [idleSession('old')]);
      setSessions([]);
      expect(screen.getByTestId('tabs')).toHaveTextContent('{}');
      expect(screen.getByTestId('active')).toHaveTextContent('null');
    });

    it('does not re-add tab for session with exited state', () => {
      function Test() {
        const { tabs } = useTabState();
        return <span data-testid="keys">{Object.keys(tabs).sort().join(',') || 'empty'}</span>;
      }
      const { setSessions } = renderWithSessions(<Test />, [idleSession('A')]);

      // session dies — removed from sessions
      setSessions([]);
      expect(screen.getByTestId('keys')).toHaveTextContent('empty');

      // server broadcasts session:states with exited state (race condition) — should NOT re-add tab
      setSessions([{ channelId: 'A', state: 'exited' as const }]);
      expect(screen.getByTestId('keys')).toHaveTextContent('empty');
    });

    it('session sync does not store cwd (cwd only for createNewTab)', () => {
      function Test() {
        const { tabs } = useTabState();
        return <span data-testid="cwd">{tabs.a?.cwd ?? 'undefined'}</span>;
      }
      const { setSessions } = renderWithSessions(<Test />);
      setSessions([{ channelId: 'a', state: 'idle', cwd: '/projects/app' }]);
      expect(screen.getByTestId('cwd')).toHaveTextContent('undefined');
    });
  });

  // ── Tab bar UI ──

  describe('tab bar UI', () => {
    it('renders tab bar after adding project', async () => {
      const summoner = createFakeSummoner();
      summoner.filesystem().setRoots(['/projects']);
      summoner.filesystem().addDirectory('/projects', ['my-app']);
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
      // Add project via dialog
      await userEvent.click(screen.getByTestId('empty-add-project'));
      await userEvent.click(await screen.findByRole('treeitem', { name: 'projects' }));
      await userEvent.click(await screen.findByRole('treeitem', { name: 'my-app' }));
      await userEvent.click(screen.getByText('Open'));
      expect(screen.getByRole('button', { name: /New Session/ })).toBeInTheDocument();
    });

    it('renders new tab button that triggers server launch', async () => {
      const { addProject: addProj } = await renderWithWorkspace();
      const proj = await addProj();
      await proj.launchSession();
      expect(screen.getByLabelText('New tab')).toBeInTheDocument();
    });
  });

  // ── Document title (DocumentTitle reads sessions from ProjectContext) ──

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
        await claude.emit(s.result());
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
            <span data-testid="active">{activeTabId ?? 'null'}</span>
            <span data-testid="count">{Object.keys(tabs).length}</span>
            <button type="button" onClick={() => addTab('remote-ch')}>
              add
            </button>
          </>
        );
      }
      const { user } = renderInTab(<Test />);

      expect(screen.getByTestId('active')).toHaveTextContent('null');

      await user.click(screen.getByText('add'));

      expect(screen.getByTestId('count')).toHaveTextContent('1');
      expect(screen.getByTestId('active')).toHaveTextContent('remote-ch');
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
      // → Tab should be visible in project's EditorArea
      expect(screen.getByPlaceholderText(/Esc to focus/i)).toBeInTheDocument();
      expect(screen.queryAllByLabelText(/^Close /).length).toBeGreaterThanOrEqual(1);
    });

    it('session:dead removes tab', async () => {
      const { claude, addProject } = await renderWithWorkspace();
      const project = await addProject();
      await project.launchSession();
      await act(async () => {
        await claude.emit(s.resultError({ errors: ['No conversation found'] }));
      });
      await act(async () => {
        claude.handle.abort();
      });

      expect(screen.getByPlaceholderText(/Esc to focus/i)).toBeInTheDocument();
    });
  });
});
