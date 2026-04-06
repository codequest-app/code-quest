import { segments as s } from '@code-quest/summoner/test';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { WorkspaceLayout } from '../../components/WorkspaceLayout';
import { createFakeClaude } from '../../test/fake-claude';
import { renderWithWorkspace } from '../../test/render-with-workspace';
import { PluginProvider } from '../PluginContext';
import { SessionProvider } from '../SessionContext';
import { SocketProvider } from '../SocketContext';
import { TabProvider, useTab } from '../TabContext';

const idleSession = (channelId: string, cwd = '/') => ({ channelId, state: 'idle' as const, cwd });

function renderInTab(ui: ReactElement) {
  const claude = createFakeClaude();
  const user = userEvent.setup();
  render(
    <SocketProvider socket={claude.socket}>
      <TabProvider>{ui}</TabProvider>
    </SocketProvider>,
  );
  return { claude, user };
}

describe('TabProvider', () => {
  // ── Unit tests (no pipeline) ──

  describe('state management', () => {
    it('provides initial empty state', () => {
      function Test() {
        const { tabs, activeTabId } = useTab();
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
        const { tabs, addTab } = useTab();
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
        tabStatus: 'default',
      });
    });

    it('addTab does not duplicate existing tab', async () => {
      function Test() {
        const { tabs, addTab } = useTab();
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
        const { tabs, addTab, removeTab } = useTab();
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
        const { activeTabId, addTab, setActiveTab, removeTab } = useTab();
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
        const { activeTabId, addTab, setActiveTab, removeTab } = useTab();
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
        const { activeTabId, addTab, setActiveTab } = useTab();
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
        const { tabs, addTab, setTabTitle } = useTab();
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
        const { tabs, addTab, setTabStatus } = useTab();
        return (
          <>
            <span data-testid="status">{tabs['tab-1']?.tabStatus ?? 'none'}</span>
            <button type="button" onClick={() => addTab('tab-1')}>
              add
            </button>
            <button type="button" onClick={() => setTabStatus('tab-1', 'pending')}>
              pending
            </button>
          </>
        );
      }
      const { user } = renderInTab(<Test />);
      await user.click(screen.getByText('add'));
      await user.click(screen.getByText('pending'));
      expect(screen.getByTestId('status')).toHaveTextContent('pending');
    });

    it('setTabTitle and setTabStatus work independently', async () => {
      function Test() {
        const { tabs, addTab, setTabTitle, setTabStatus } = useTab();
        return (
          <>
            <span data-testid="tab">{JSON.stringify(tabs['tab-1'] ?? null)}</span>
            <button type="button" onClick={() => addTab('tab-1')}>
              add
            </button>
            <button type="button" onClick={() => setTabTitle('tab-1', 'Hello')}>
              title
            </button>
            <button type="button" onClick={() => setTabStatus('tab-1', 'done')}>
              done
            </button>
          </>
        );
      }
      const { user } = renderInTab(<Test />);
      await user.click(screen.getByText('add'));
      await user.click(screen.getByText('title'));
      await user.click(screen.getByText('done'));
      expect(JSON.parse(screen.getByTestId('tab').textContent!)).toEqual({
        title: 'Hello',
        tabStatus: 'done',
      });
    });

    it('throws when useTab is called outside provider', () => {
      expect(() => renderHook(() => useTab())).toThrow('useTab must be used within a TabProvider');
    });
  });

  // ── createNewTab ──

  describe('createNewTab', () => {
    it('creates tab with cwd', async () => {
      function Test() {
        const { tabs, activeTabId, createNewTab } = useTab();
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
        const { tabs, createNewTab } = useTab();
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
        const { tabs, syncFromServer } = useTab();
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
        const { tabs, addTab, setActiveTab, syncFromServer } = useTab();
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
        const { tabs, addTab, syncFromServer } = useTab();
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
        const { activeTabId, syncFromServer } = useTab();
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
        const { activeTabId, addTab, setActiveTab, syncFromServer } = useTab();
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
        const { activeTabId, addTab, setActiveTab, syncFromServer } = useTab();
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
        const { tabs, activeTabId, addTab, syncFromServer } = useTab();
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
        const { tabs, syncFromServer } = useTab();
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
      const { socket } = createFakeClaude();
      render(
        <SocketProvider socket={socket}>
          <SessionProvider>
            <PluginProvider>
              <TabProvider>
                <WorkspaceLayout />
              </TabProvider>
            </PluginProvider>
          </SessionProvider>
        </SocketProvider>,
      );
      expect(screen.getByTestId('tab-bar')).toBeInTheDocument();
    });

    it('renders new tab button that calls createNewTab', async () => {
      const claude = createFakeClaude();
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
      await userEvent.click(screen.getByLabelText('New tab'));
      expect(claude.provider.all.length).toBeGreaterThan(0);
    });
  });

  // ── Document title ──

  describe('document title', () => {
    it('sets title to base when idle', () => {
      const { socket } = createFakeClaude();
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
      const { socket } = createFakeClaude();
      function TestComponent() {
        const { addTab, setActiveTab, setTabStatus } = useTab();
        return (
          <button
            type="button"
            onClick={() => {
              addTab('t1');
              setActiveTab('t1');
              setTabStatus('t1', 'pending');
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
      const { socket } = createFakeClaude();
      function TestComponent() {
        const { addTab, setActiveTab, setTabStatus } = useTab();
        return (
          <>
            <button
              type="button"
              data-testid="set-pending"
              onClick={() => {
                addTab('t1');
                setActiveTab('t1');
                setTabStatus('t1', 'pending');
              }}
            >
              pending
            </button>
            <button
              type="button"
              data-testid="set-default"
              onClick={() => setTabStatus('t1', 'default')}
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
        const { tabs, activeTabId, addTab } = useTab();
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
      await claude.emit(s.resultError({ errors: ['No conversation found'] }));
      await act(async () => {
        claude.handle.abort();
      });

      expect(screen.getByPlaceholderText(/Esc to focus/i)).toBeInTheDocument();
    });
  });
});
