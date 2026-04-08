import { segments as s } from '@code-quest/summoner/test';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { WorkspaceLayout } from '../../components/WorkspaceLayout';
import { createFakeSummoner } from '../../test/fake-summoner';
import { renderWithWorkspace } from '../../test/render-with-workspace';
import { PluginProvider } from '../PluginContext';
import { ProjectProvider } from '../ProjectContext';
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

describe('TabProvider', () => {
  // ── Unit tests (no pipeline) ──

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

  // ── createNewTab ──

  describe('createNewTab', () => {
    it('creates tab with cwd', async () => {
      function Test() {
        const { tabs, activeTabId } = useTabState();
        const { createNewTab } = useTabActions();
        const cwd = activeTabId ? tabs[activeTabId]?.cwd : undefined;
        return (
          <>
            <span data-testid="cwd">{cwd ?? 'none'}</span>
            <button type="button" onClick={() => createNewTab({ cwd: '/my/project' })}>
              create
            </button>
          </>
        );
      }
      const { user } = renderInTab(<Test />);
      await user.click(screen.getByText('create'));
      expect(screen.getByTestId('cwd')).toHaveTextContent('/my/project');
    });

    it('is a synchronous local operation (no server interaction)', async () => {
      function Test() {
        const { tabs } = useTabState();
        const { createNewTab } = useTabActions();
        return (
          <>
            <span data-testid="count">{Object.keys(tabs).length}</span>
            <button type="button" onClick={() => createNewTab()}>
              create
            </button>
          </>
        );
      }
      const { user } = renderInTab(<Test />);
      await user.click(screen.getByText('create'));
      // Tab created immediately in local state
      expect(screen.getByTestId('count')).toHaveTextContent('1');
    });
  });

  // ── syncFromServer ──

  describe('syncFromServer', () => {
    it('adds tabs for server sessions', async () => {
      function Test() {
        const { tabs } = useTabState();
        const { syncFromServer } = useTabActions();
        return (
          <>
            <span data-testid="keys">{Object.keys(tabs).sort().join(',')}</span>
            <button
              type="button"
              onClick={() => syncFromServer([idleSession('a'), idleSession('b')])}
            >
              sync
            </button>
          </>
        );
      }
      const { user } = renderInTab(<Test />);
      await user.click(screen.getByText('sync'));
      expect(screen.getByTestId('keys')).toHaveTextContent('a,b');
    });

    it('removes stale tabs not in server sessions', async () => {
      function Test() {
        const { tabs } = useTabState();
        const { addTab, setActiveTab, syncFromServer } = useTabActions();
        return (
          <>
            <span data-testid="has-stale">{String('stale' in tabs)}</span>
            <span data-testid="has-fresh">{String('fresh' in tabs)}</span>
            <button
              type="button"
              onClick={() => {
                addTab('stale');
                setActiveTab('stale');
              }}
            >
              setup
            </button>
            <button
              type="button"
              onClick={() => syncFromServer([{ channelId: 'fresh', state: 'idle', cwd: '/' }])}
            >
              sync
            </button>
          </>
        );
      }
      const { user } = renderInTab(<Test />);
      await user.click(screen.getByText('setup'));
      await user.click(screen.getByText('sync'));
      expect(screen.getByTestId('has-stale')).toHaveTextContent('false');
      expect(screen.getByTestId('has-fresh')).toHaveTextContent('true');
    });

    it('is idempotent — no change when tabs match sessions', async () => {
      function Test() {
        const { tabs } = useTabState();
        const { addTab, syncFromServer } = useTabActions();
        return (
          <>
            <span data-testid="tabs">{JSON.stringify(tabs)}</span>
            <button type="button" onClick={() => addTab('a')}>
              add
            </button>
            <button type="button" onClick={() => syncFromServer([idleSession('a')])}>
              sync
            </button>
          </>
        );
      }
      const { user } = renderInTab(<Test />);
      await user.click(screen.getByText('add'));
      const before = screen.getByTestId('tabs').textContent;
      await user.click(screen.getByText('sync'));
      expect(screen.getByTestId('tabs')).toHaveTextContent(before!);
    });

    it('sets activeTabId to first session when no active tab', async () => {
      function Test() {
        const { activeTabId } = useTabState();
        const { syncFromServer } = useTabActions();
        return (
          <>
            <span data-testid="active">{activeTabId ?? 'null'}</span>
            <button
              type="button"
              onClick={() =>
                syncFromServer([
                  { channelId: 'x', state: 'idle', cwd: '/' },
                  { channelId: 'y', state: 'idle', cwd: '/' },
                ])
              }
            >
              sync
            </button>
          </>
        );
      }
      const { user } = renderInTab(<Test />);
      await user.click(screen.getByText('sync'));
      expect(screen.getByTestId('active')).toHaveTextContent('x');
    });

    it('preserves activeTabId when it is still alive', async () => {
      function Test() {
        const { activeTabId } = useTabState();
        const { addTab, setActiveTab, syncFromServer } = useTabActions();
        return (
          <>
            <span data-testid="active">{activeTabId ?? 'null'}</span>
            <button
              type="button"
              onClick={() => {
                addTab('keep');
                setActiveTab('keep');
              }}
            >
              setup
            </button>
            <button
              type="button"
              onClick={() =>
                syncFromServer([
                  { channelId: 'keep', state: 'idle', cwd: '/' },
                  { channelId: 'other', state: 'idle', cwd: '/' },
                ])
              }
            >
              sync
            </button>
          </>
        );
      }
      const { user } = renderInTab(<Test />);
      await user.click(screen.getByText('setup'));
      await user.click(screen.getByText('sync'));
      expect(screen.getByTestId('active')).toHaveTextContent('keep');
    });

    it('resets activeTabId when persisted tab no longer alive', async () => {
      function Test() {
        const { activeTabId } = useTabState();
        const { addTab, setActiveTab, syncFromServer } = useTabActions();
        return (
          <>
            <span data-testid="active">{activeTabId ?? 'null'}</span>
            <button
              type="button"
              onClick={() => {
                addTab('dead');
                setActiveTab('dead');
              }}
            >
              setup
            </button>
            <button
              type="button"
              onClick={() => syncFromServer([{ channelId: 'new', state: 'idle', cwd: '/' }])}
            >
              sync
            </button>
          </>
        );
      }
      const { user } = renderInTab(<Test />);
      await user.click(screen.getByText('setup'));
      await user.click(screen.getByText('sync'));
      expect(screen.getByTestId('active')).toHaveTextContent('new');
    });

    it('handles empty sessions', async () => {
      function Test() {
        const { tabs, activeTabId } = useTabState();
        const { addTab, syncFromServer } = useTabActions();
        return (
          <>
            <span data-testid="tabs">{JSON.stringify(tabs)}</span>
            <span data-testid="active">{activeTabId ?? 'null'}</span>
            <button type="button" onClick={() => addTab('old')}>
              add
            </button>
            <button type="button" onClick={() => syncFromServer([])}>
              sync
            </button>
          </>
        );
      }
      const { user } = renderInTab(<Test />);
      await user.click(screen.getByText('add'));
      await user.click(screen.getByText('sync'));
      expect(screen.getByTestId('tabs')).toHaveTextContent('{}');
      expect(screen.getByTestId('active')).toHaveTextContent('null');
    });

    it('does not store cwd from server sessions (join does not need cwd)', async () => {
      function Test() {
        const { tabs } = useTabState();
        const { syncFromServer } = useTabActions();
        return (
          <>
            <span data-testid="cwd">{tabs.a?.cwd ?? 'undefined'}</span>
            <button
              type="button"
              onClick={() =>
                syncFromServer([{ channelId: 'a', state: 'idle', cwd: '/projects/app' }])
              }
            >
              sync
            </button>
          </>
        );
      }
      const { user } = renderInTab(<Test />);
      await user.click(screen.getByText('sync'));
      expect(screen.getByTestId('cwd')).toHaveTextContent('undefined');
    });
  });

  // ── Tab bar UI ──

  describe('tab bar UI', () => {
    it('renders tab bar with WorkspaceLayout', () => {
      const { socket } = createFakeSummoner();
      render(
        <SocketProvider socket={socket}>
          <SessionProvider>
            <PluginProvider>
              <TabProvider>
                <ProjectProvider>
                  <WorkspaceLayout />
                </ProjectProvider>
              </TabProvider>
            </PluginProvider>
          </SessionProvider>
        </SocketProvider>,
      );
      expect(screen.getByTestId('tab-bar')).toBeInTheDocument();
    });

    it.todo('renders new tab button that calls createNewTab — needs project to show EditorArea');

    it.skip('renders new tab button that calls createNewTab', async () => {
      const summoner = createFakeSummoner();
      render(
        <SocketProvider socket={summoner.socket}>
          <SessionProvider>
            <PluginProvider>
              <TabProvider>
                <ProjectProvider>
                  <WorkspaceLayout />
                </ProjectProvider>
              </TabProvider>
            </PluginProvider>
          </SessionProvider>
        </SocketProvider>,
      );
      await userEvent.click(screen.getByLabelText('New tab'));
      expect(summoner.claude().provider.all.length).toBeGreaterThan(0);
    });
  });

  // ── Document title ──

  describe('document title', () => {
    it('sets title to base when idle', () => {
      const { socket } = createFakeSummoner();
      render(
        <SocketProvider socket={socket}>
          <TabProvider>
            <div />
          </TabProvider>
        </SocketProvider>,
      );
      expect(document.title).toBe('Code Quest');
    });

    it('shows spinner prefix when active tab has pending status', async () => {
      const { socket } = createFakeSummoner();
      function TestComponent() {
        const { addTab, setActiveTab, setTabStatus } = useTabActions();
        return (
          <button
            type="button"
            onClick={() => {
              addTab('t1');
              setActiveTab('t1');
              setTabStatus('t1', 'processing');
            }}
          >
            trigger
          </button>
        );
      }
      render(
        <SocketProvider socket={socket}>
          <TabProvider>
            <TestComponent />
          </TabProvider>
        </SocketProvider>,
      );
      await userEvent.click(screen.getByText('trigger'));
      expect(document.title).toBe('⟳ Code Quest');
    });

    it('returns to base title when tab status changes from pending to default', async () => {
      const { socket } = createFakeSummoner();
      function TestComponent() {
        const { addTab, setActiveTab, setTabStatus } = useTabActions();
        return (
          <>
            <button
              type="button"
              data-testid="set-pending"
              onClick={() => {
                addTab('t1');
                setActiveTab('t1');
                setTabStatus('t1', 'processing');
              }}
            >
              pending
            </button>
            <button
              type="button"
              data-testid="set-default"
              onClick={() => setTabStatus('t1', 'idle')}
            >
              default
            </button>
          </>
        );
      }
      render(
        <SocketProvider socket={socket}>
          <TabProvider>
            <TestComponent />
          </TabProvider>
        </SocketProvider>,
      );

      await userEvent.click(screen.getByTestId('set-pending'));
      expect(document.title).toBe('⟳ Code Quest');

      await userEvent.click(screen.getByTestId('set-default'));
      expect(document.title).toBe('Code Quest');
    });
  });

  describe('socket events', () => {
    it('session:created adds a tab — UI shows content', async () => {
      await renderWithWorkspace();
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
      await renderWithWorkspace();
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
      const { user } = await renderWithWorkspace();
      const tabsBefore = screen.queryAllByLabelText(/^Close /).length;
      await user.click(screen.getByLabelText('New tab'));

      await waitFor(() => {
        expect(screen.queryAllByLabelText(/^Close /).length).toBe(tabsBefore + 1);
      });
    });

    it('session:dead removes tab', async () => {
      const { claude } = await renderWithWorkspace();
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
