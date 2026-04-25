import type { SessionStateSummary } from '@code-quest/shared';
import { render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { createFakeSummoner } from '../../../test/fake-summoner';
import {
  NavigationProvider,
  useNavigationActions,
  useNavigationState,
} from '../../NavigationContext';
import { ProjectProvider } from '../../ProjectContext';
import { SessionProvider } from '../../SessionContext';
import { SocketProvider } from '../../SocketContext';
import { TabProvider, useTabActions, useTabState } from '../../TabContext';

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
          <NavigationProvider>
            <TabProvider cwd={initial.cwd} sessions={sessions}>
              {ui}
            </TabProvider>
          </NavigationProvider>
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
            <NavigationProvider>
              <TabProvider cwd={initial.cwd} sessions={sessions}>
                {ui}
              </TabProvider>
            </NavigationProvider>
          </ProjectProvider>
        </SessionProvider>
      </SocketProvider>,
    );
  }
  return { setSessions };
}

describe('TabProvider', () => {
  describe('pendingActivateChannel intent (Decision 10)', () => {
    function ProbeAndTrigger({ trigger }: { trigger: { cwd: string; channelId: string } }) {
      const { activeTabId } = useTabState();
      const { pendingActivateChannel } = useNavigationState();
      const { requestActivateChannel } = useNavigationActions();
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
          sessions: [{ channelId: 'ch-1', state: 'idle', cwd: '/proj', projectRoot: '/proj' }],
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
      setSessions([{ channelId: 'ch-late', state: 'idle', cwd: '/proj', projectRoot: '/proj' }]);

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
            { channelId: 'ch-a', state: 'idle', cwd: '/proj', projectRoot: '/proj' },
            { channelId: 'ch-target', state: 'idle', cwd: '/proj', projectRoot: '/proj' },
          ],
        },
      );

      const user = userEvent.setup({ pointerEventsCheck: 0 });
      await user.click(screen.getByText('request'));

      // Wait for the pending intent to land; active staying put is the
      // negative half of the same observation.
      await vi.waitFor(() => {
        expect(screen.getByTestId('pending')).toHaveTextContent('"channelId":"ch-target"');
      });
      expect(screen.getByTestId('active')).toHaveTextContent('ch-a');
    });
  });

  describe('replaceTab(oldId, newId)', () => {
    function Harness({ trigger }: { trigger: { oldId: string; newId: string } }) {
      const { tabs, activeTabId } = useTabState();
      const { addTab, setActiveTab, replaceTab } = useTabActions();
      return (
        <>
          <span data-testid="tabs">{JSON.stringify(Object.keys(tabs))}</span>
          <span data-testid="active">{activeTabId ?? 'null'}</span>
          <button type="button" onClick={() => addTab('old', '/proj')}>
            seed-old
          </button>
          <button type="button" onClick={() => addTab('other')}>
            seed-other
          </button>
          <button type="button" onClick={() => setActiveTab('old')}>
            activate-old
          </button>
          <button type="button" onClick={() => replaceTab(trigger.oldId, trigger.newId)}>
            replace
          </button>
        </>
      );
    }

    it('replaces the entry keyed oldId with newId; activeTabId follows if it was oldId', async () => {
      const { user } = renderInTab(<Harness trigger={{ oldId: 'old', newId: 'new' }} />);

      await user.click(screen.getByText('seed-old'));
      await user.click(screen.getByText('replace'));

      expect(JSON.parse(screen.getByTestId('tabs').textContent!)).toEqual(['new']);
      expect(screen.getByTestId('active')).toHaveTextContent('new');
    });

    it('is a no-op when oldId is not in tabs', async () => {
      const { user } = renderInTab(<Harness trigger={{ oldId: 'missing', newId: 'new' }} />);

      await user.click(screen.getByText('seed-old'));
      await user.click(screen.getByText('replace'));

      expect(JSON.parse(screen.getByTestId('tabs').textContent!)).toEqual(['old']);
      expect(screen.getByTestId('active')).toHaveTextContent('old');
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
        launchOnMount: false,
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
        launchOnMount: false,
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

  describe('split mode is removed', () => {
    it('TabActions does not expose enterSplit / exitSplit', () => {
      const summoner = createFakeSummoner();
      const { result } = renderHook(() => useTabActions(), {
        wrapper: ({ children }) => (
          <SocketProvider socket={summoner.socket}>
            <TabProvider>{children}</TabProvider>
          </SocketProvider>
        ),
      });
      expect(result.current).not.toHaveProperty('enterSplit');
      expect(result.current).not.toHaveProperty('exitSplit');
    });

    it('TabState does not expose splitTabId', () => {
      const summoner = createFakeSummoner();
      const { result } = renderHook(() => useTabState(), {
        wrapper: ({ children }) => (
          <SocketProvider socket={summoner.socket}>
            <TabProvider>{children}</TabProvider>
          </SocketProvider>
        ),
      });
      expect(result.current).not.toHaveProperty('splitTabId');
    });
  });
});
