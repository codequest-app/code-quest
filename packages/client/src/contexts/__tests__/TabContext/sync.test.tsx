import type { SessionStateSummary } from '@code-quest/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { createFakeSummoner } from '../../../test/fake-summoner';
import { SocketProvider } from '../../SocketContext';
import { TabProvider, useTabActions, useTabState } from '../../TabContext';

const idleSession = (channelId: string, cwd = '/') => ({
  channelId,
  state: 'idle' as const,
  cwd,
  projectRoot: cwd,
});

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

describe('TabProvider', () => {
  describe('tab creation from sessions', () => {
    it('preserves cwd from session sync (resume / fork need this)', () => {
      function Test() {
        const { tabs, activeTabId } = useTabState();
        const cwd = activeTabId ? tabs[activeTabId]?.cwd : undefined;
        return <span data-testid="cwd">{cwd ?? 'none'}</span>;
      }
      const { setSessions } = renderWithSessions(<Test />);
      setSessions([
        { channelId: 'ch-1', state: 'idle', cwd: '/my/project', projectRoot: '/my/project' },
      ]);
      expect(screen.getByTestId('cwd')).toHaveTextContent('/my/project');
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
      setSessions([{ channelId: 'A', state: 'exited' as const, projectRoot: '/test/project' }]);
      expect(screen.getByTestId('keys')).toHaveTextContent('empty');
    });

    it('session sync stores cwd from the session entry', () => {
      function Test() {
        const { tabs } = useTabState();
        return <span data-testid="cwd">{tabs.a?.cwd ?? 'undefined'}</span>;
      }
      const { setSessions } = renderWithSessions(<Test />);
      setSessions([
        { channelId: 'a', state: 'idle', cwd: '/projects/app', projectRoot: '/projects/app' },
      ]);
      expect(screen.getByTestId('cwd')).toHaveTextContent('/projects/app');
    });
  });

  describe('launchOnMount flag (separates "spawn new" from "channel exists on server")', () => {
    it('tabs synced from server sessions do NOT request a new spawn', () => {
      function Test() {
        const { tabs } = useTabState();
        return <span data-testid="flag">{String(tabs.a?.launchOnMount ?? 'missing')}</span>;
      }
      const { setSessions } = renderWithSessions(<Test />);
      setSessions([
        { channelId: 'a', state: 'idle', cwd: '/projects/app', projectRoot: '/projects/app' },
      ]);
      expect(screen.getByTestId('flag')).toHaveTextContent('false');
    });

    it('new tabs created via createNewTab spawn on mount', async () => {
      let createdId = '';
      function Test() {
        const { tabs } = useTabState();
        const actions = useTabActions();
        return (
          <>
            <button
              type="button"
              data-testid="create"
              onClick={() => {
                createdId = actions.createNewTab({ cwd: '/x' }).channelId;
              }}
            >
              create
            </button>
            <span data-testid="flag">
              {createdId ? String(tabs[createdId]?.launchOnMount ?? 'missing') : '-'}
            </span>
          </>
        );
      }
      const { user } = renderWithSessions(<Test />);
      await user.click(screen.getByTestId('create'));
      expect(screen.getByTestId('flag')).toHaveTextContent('true');
    });
  });
});
