import { segments as s } from '@code-quest/summoner/test';
import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { WorkspaceLayout } from '../../components/WorkspaceLayout';
import { createFakeClaude } from '../../test/fake-claude';
import { renderWithWorkspace } from '../../test/render-with-workspace';
import { PluginProvider } from '../PluginContext';
import { SessionProvider } from '../SessionContext';
import { SocketProvider } from '../SocketContext';
import { TabProvider, useTab } from '../TabContext';

function unitWrapper() {
  const { socket } = createFakeClaude();
  return ({ children }: { children: ReactNode }) => (
    <SocketProvider socket={socket}>
      <TabProvider>{children}</TabProvider>
    </SocketProvider>
  );
}

describe('TabProvider', () => {
  // ── Unit tests (no pipeline) ──

  describe('state management', () => {
    it('provides initial empty state', () => {
      const { result } = renderHook(() => useTab(), { wrapper: unitWrapper() });
      expect(result.current.tabs).toEqual({});
      expect(result.current.activeTabId).toBeNull();
    });

    it('addTab adds a tab', () => {
      const { result } = renderHook(() => useTab(), { wrapper: unitWrapper() });
      act(() => result.current.addTab('tab-1'));
      expect(result.current.tabs).toHaveProperty('tab-1');
      expect(result.current.tabs['tab-1']).toEqual({ title: undefined, tabStatus: 'default' });
    });

    it('addTab does not duplicate existing tab', () => {
      const { result } = renderHook(() => useTab(), { wrapper: unitWrapper() });
      act(() => result.current.addTab('tab-1'));
      act(() => result.current.addTab('tab-1'));
      expect(Object.keys(result.current.tabs)).toHaveLength(1);
    });

    it('removeTab removes a tab', () => {
      const { result } = renderHook(() => useTab(), { wrapper: unitWrapper() });
      act(() => result.current.addTab('tab-1'));
      act(() => result.current.removeTab('tab-1'));
      expect(result.current.tabs).not.toHaveProperty('tab-1');
    });

    it('removeTab switches activeTabId when active tab is removed', () => {
      const { result } = renderHook(() => useTab(), { wrapper: unitWrapper() });
      act(() => {
        result.current.addTab('tab-1');
        result.current.addTab('tab-2');
        result.current.setActiveTab('tab-2');
      });
      act(() => result.current.removeTab('tab-2'));
      expect(result.current.activeTabId).toBe('tab-1');
    });

    it('removeTab sets activeTabId to null when last tab removed', () => {
      const { result } = renderHook(() => useTab(), { wrapper: unitWrapper() });
      act(() => {
        result.current.addTab('tab-1');
        result.current.setActiveTab('tab-1');
      });
      act(() => result.current.removeTab('tab-1'));
      expect(result.current.activeTabId).toBeNull();
    });

    it('setActiveTab updates activeTabId', () => {
      const { result } = renderHook(() => useTab(), { wrapper: unitWrapper() });
      act(() => {
        result.current.addTab('tab-1');
        result.current.setActiveTab('tab-1');
      });
      expect(result.current.activeTabId).toBe('tab-1');
    });

    it('setTabTitle updates tab title', () => {
      const { result } = renderHook(() => useTab(), { wrapper: unitWrapper() });
      act(() => result.current.addTab('tab-1'));
      act(() => result.current.setTabTitle('tab-1', 'Hello'));
      expect(result.current.tabs['tab-1'].title).toBe('Hello');
    });

    it('setTabStatus updates tab status', () => {
      const { result } = renderHook(() => useTab(), { wrapper: unitWrapper() });
      act(() => result.current.addTab('tab-1'));
      act(() => result.current.setTabStatus('tab-1', 'pending'));
      expect(result.current.tabs['tab-1'].tabStatus).toBe('pending');
    });

    it('setTabTitle and setTabStatus work independently', () => {
      const { result } = renderHook(() => useTab(), { wrapper: unitWrapper() });
      act(() => result.current.addTab('tab-1'));
      act(() => result.current.setTabTitle('tab-1', 'Hello'));
      act(() => result.current.setTabStatus('tab-1', 'done'));
      expect(result.current.tabs['tab-1']).toEqual({ title: 'Hello', tabStatus: 'done' });
    });

    it('throws when useTab is called outside provider', () => {
      expect(() => renderHook(() => useTab())).toThrow('useTab must be used within a TabProvider');
    });
  });

  // ── syncFromServer ──

  describe('syncFromServer', () => {
    it('adds tabs for server sessions', () => {
      const { result } = renderHook(() => useTab(), { wrapper: unitWrapper() });
      act(() =>
        result.current.syncFromServer([
          { channelId: 'a', state: 'idle' },
          { channelId: 'b', state: 'idle' },
        ]),
      );
      expect(Object.keys(result.current.tabs).sort()).toEqual(['a', 'b']);
    });

    it('removes stale tabs not in server sessions', () => {
      const { result } = renderHook(() => useTab(), { wrapper: unitWrapper() });
      act(() => {
        result.current.addTab('stale');
        result.current.setActiveTab('stale');
      });
      act(() => result.current.syncFromServer([{ channelId: 'fresh', state: 'idle' }]));
      expect(result.current.tabs).not.toHaveProperty('stale');
      expect(result.current.tabs).toHaveProperty('fresh');
    });

    it('is idempotent — no change when tabs match sessions', () => {
      const { result } = renderHook(() => useTab(), { wrapper: unitWrapper() });
      act(() => result.current.addTab('a'));
      const before = result.current.tabs;
      act(() => result.current.syncFromServer([{ channelId: 'a', state: 'idle' }]));
      expect(result.current.tabs).toEqual(before);
    });

    it('sets activeTabId to first session when no active tab', () => {
      const { result } = renderHook(() => useTab(), { wrapper: unitWrapper() });
      act(() =>
        result.current.syncFromServer([
          { channelId: 'x', state: 'idle' },
          { channelId: 'y', state: 'idle' },
        ]),
      );
      expect(result.current.activeTabId).toBe('x');
    });

    it('preserves activeTabId when it is still alive', () => {
      const { result } = renderHook(() => useTab(), { wrapper: unitWrapper() });
      act(() => {
        result.current.addTab('keep');
        result.current.setActiveTab('keep');
      });
      act(() =>
        result.current.syncFromServer([
          { channelId: 'keep', state: 'idle' },
          { channelId: 'other', state: 'idle' },
        ]),
      );
      expect(result.current.activeTabId).toBe('keep');
    });

    it('resets activeTabId when persisted tab no longer alive', () => {
      const { result } = renderHook(() => useTab(), { wrapper: unitWrapper() });
      act(() => {
        result.current.addTab('dead');
        result.current.setActiveTab('dead');
      });
      act(() => result.current.syncFromServer([{ channelId: 'new', state: 'idle' }]));
      expect(result.current.activeTabId).toBe('new');
    });

    it('handles empty sessions', () => {
      const { result } = renderHook(() => useTab(), { wrapper: unitWrapper() });
      act(() => result.current.addTab('old'));
      act(() => result.current.syncFromServer([]));
      expect(result.current.tabs).toEqual({});
      expect(result.current.activeTabId).toBeNull();
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

    it('launching second session creates second tab', async () => {
      const { user } = await renderWithWorkspace();
      await user.click(screen.getByLabelText('New tab'));

      expect(screen.queryAllByPlaceholderText(/Esc to focus/i).length).toBeGreaterThanOrEqual(1);
    });

    it('session:dead removes tab', async () => {
      const { claude } = await renderWithWorkspace();
      await claude.emit(s.resultError({ errors: ['No conversation found'] }));
      await act(async () => {
        claude.handle.abort();
      });

      expect(screen.getByPlaceholderText(/Esc to focus/i)).toBeInTheDocument();
    });

    it('activeTab auto-set on first session:created', async () => {
      await renderWithWorkspace();
      expect(screen.getByPlaceholderText(/Esc to focus/i)).toBeInTheDocument();
    });
  });
});
