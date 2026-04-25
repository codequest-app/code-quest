import { type SessionStateSummary, sessionBroadcastStateSchema } from '@code-quest/shared';
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react';
import type { SessionStatus } from '../types/ui';
// Intentional dependency — NavigationContext mediates sidebar/editor
// intents (activate channel, open worktree). Soft-bound via direct useContext
// so TabProvider can be mounted standalone in tests without a NavigationProvider.
import { NavigationActionsContext, NavigationStateContext } from './NavigationContext';

interface TabMeta {
  title?: string;
  tabStatus: SessionStatus;
  cwd?: string;
}

// ── State context (changes frequently) ──

interface TabStateValue {
  tabs: Record<string, TabMeta>;
  activeTabId: string | null;
  /** When set, the chat area renders the active tab + this tab side-by-side. */
  splitTabId: string | null;
}

export const TabStateContext = createContext<TabStateValue | null>(null);

export function useTabState(): TabStateValue {
  const ctx = useContext(TabStateContext);
  if (!ctx) throw new Error('useTabState must be used within a TabProvider');
  return ctx;
}

// ── Actions context (stable references) ──

interface TabActionsValue {
  addTab: (id: string, cwd?: string) => void;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  setTabTitle: (id: string, title: string) => void;
  setTabStatus: (id: string, status: TabMeta['tabStatus']) => void;
  createNewTab: (opts?: { cwd?: string }) => { channelId: string };
  replaceActiveTab: (newChannelId: string) => void;
  replaceTab: (oldChannelId: string, newChannelId: string) => void;
  /** Show the given tab side-by-side with the active tab. No-op if id === activeTabId. */
  enterSplit: (id: string) => void;
  /** Exit split mode (active tab keeps focus). */
  exitSplit: () => void;
}

const TabActionsContext = createContext<TabActionsValue | null>(null);

export function useTabActions(): TabActionsValue {
  const ctx = useContext(TabActionsContext);
  if (!ctx) throw new Error('useTabActions must be used within a TabProvider');
  return ctx;
}

// ── Provider ──

const DEFAULT_META: TabMeta = { title: undefined, tabStatus: 'connecting' };
const TERMINAL_STATES = new Set<string>(
  sessionBroadcastStateSchema.extract(['exited', 'disconnected']).options,
);

export function TabProvider({
  children,
  initialState,
  sessions,
  cwd,
  selectedCwd,
}: {
  children: ReactNode;
  initialState?: { tabs: Record<string, TabMeta>; activeTabId: string | null };
  sessions?: SessionStateSummary[];
  cwd?: string;
  /** Sidebar selection within this project. When set, `createNewTab()` (no
   *  args) uses this instead of `cwd`. Lets `+` open a chat in the
   *  currently-browsed worktree without explicit cwd plumbing. */
  selectedCwd?: string;
}) {
  const [state, setState] = useState<TabStateValue>(() => ({
    tabs: initialState?.tabs ?? {},
    activeTabId: initialState?.activeTabId ?? null,
    splitTabId: null,
  }));

  // cwd prop is read inside stable actions via ref so actions keep a single
  // identity across renders (otherwise downstream memoization breaks).
  const cwdRef = useRef(cwd);
  cwdRef.current = cwd;
  const selectedCwdRef = useRef(selectedCwd);
  selectedCwdRef.current = selectedCwd;

  const [actions] = useState<TabActionsValue>(() => ({
    addTab: (id, cwd) => {
      setState((prev) => {
        if (id in prev.tabs) return prev;
        const tabs = { ...prev.tabs, [id]: { ...DEFAULT_META, cwd } };
        return { ...prev, tabs, activeTabId: prev.activeTabId ?? id };
      });
    },
    removeTab: (id) => {
      setState((prev) => {
        if (!(id in prev.tabs)) return prev;
        const { [id]: _, ...rest } = prev.tabs;
        const wasActive = prev.activeTabId === id;
        const wasSplit = prev.splitTabId === id;
        // If split tab is removed, clear split. If active is removed, promote
        // splitTabId (when set) to active so users keep their secondary view.
        const splitTabId = wasSplit || wasActive ? null : prev.splitTabId;
        const activeTabId = wasActive
          ? (prev.splitTabId ?? Object.keys(rest)[0] ?? null)
          : prev.activeTabId;
        return { tabs: rest, activeTabId, splitTabId };
      });
    },
    setActiveTab: (id) => {
      setState((prev) => (prev.activeTabId === id ? prev : { ...prev, activeTabId: id }));
    },
    setTabTitle: (id, title) => {
      setState((prev) => {
        const existing = prev.tabs[id];
        if (!existing) return prev;
        return { ...prev, tabs: { ...prev.tabs, [id]: { ...existing, title } } };
      });
    },
    setTabStatus: (id, status) => {
      setState((prev) => {
        const existing = prev.tabs[id];
        if (!existing) return prev;
        return { ...prev, tabs: { ...prev.tabs, [id]: { ...existing, tabStatus: status } } };
      });
    },
    createNewTab: (opts) => {
      const channelId = crypto.randomUUID();
      const tabCwd = opts?.cwd ?? selectedCwdRef.current ?? cwdRef.current;
      setState((prev) => ({
        ...prev,
        tabs: { ...prev.tabs, [channelId]: { ...DEFAULT_META, cwd: tabCwd } },
        activeTabId: channelId,
      }));
      return { channelId };
    },
    replaceActiveTab: (newChannelId) => {
      setState((prev) => {
        if (!prev.activeTabId) return prev;
        const { [prev.activeTabId]: _, ...rest } = prev.tabs;
        return {
          ...prev,
          tabs: { ...rest, [newChannelId]: DEFAULT_META },
          activeTabId: newChannelId,
        };
      });
    },
    enterSplit: (id) => {
      setState((prev) => {
        if (!(id in prev.tabs)) return prev;
        if (id === prev.activeTabId) return prev;
        if (prev.splitTabId === id) return prev;
        return { ...prev, splitTabId: id };
      });
    },
    exitSplit: () => {
      setState((prev) => (prev.splitTabId === null ? prev : { ...prev, splitTabId: null }));
    },
    replaceTab: (oldChannelId, newChannelId) => {
      setState((prev) => {
        if (!(oldChannelId in prev.tabs)) return prev;
        const { [oldChannelId]: old, ...rest } = prev.tabs;
        return {
          ...prev,
          tabs: { ...rest, [newChannelId]: { ...old } },
          activeTabId: prev.activeTabId === oldChannelId ? newChannelId : prev.activeTabId,
          splitTabId: prev.splitTabId === oldChannelId ? newChannelId : prev.splitTabId,
        };
      });
    },
  }));

  // Sync tabs from sessions prop (incremental diff)
  const prevSessionIds = useRef<Set<string>>(new Set());
  // biome-ignore lint/correctness/useExhaustiveDependencies: addTab/removeTab/replaceActiveTab only call setState — deps are intentionally limited to sessions to avoid re-running the diff on every render
  useEffect(() => {
    if (!sessions) return;
    const currentIds = new Set(sessions.map((s) => s.channelId));
    const added = sessions.filter(
      (s) => !prevSessionIds.current.has(s.channelId) && !TERMINAL_STATES.has(s.state),
    );
    const removed = [...prevSessionIds.current].filter((id) => !currentIds.has(id));

    if (added.length === 1 && removed.length === 1) {
      actions.replaceActiveTab(added[0].channelId);
    } else {
      for (const s of added) {
        actions.addTab(s.channelId);
      }
      for (const id of removed) {
        actions.removeTab(id);
      }
    }
    prevSessionIds.current = currentIds;
  }, [sessions]);

  // Consume pendingActivateChannel intent from NavigationContext.
  // Fires only when (a) the cwd matches our own AND (b) the channel is
  // already in our tabs. Otherwise we wait — the sessions-prop effect above
  // may add the channel later, and this effect will re-run via the tabs dep.
  // Dep array MUST include both pendingActivateChannel AND state.tabs,
  // otherwise a pending intent that lands before auto-addTab is silently lost.
  const navState = useContext(NavigationStateContext);
  const navActions = useContext(NavigationActionsContext);
  const pendingActivateChannel = navState?.pendingActivateChannel ?? null;
  // biome-ignore lint/correctness/useExhaustiveDependencies: setActiveTab is a local closure that only calls setState; navActions identity is preserved by NavigationProvider's useState initializer
  useEffect(() => {
    if (!pendingActivateChannel || !navActions) return;
    if (pendingActivateChannel.cwd !== cwd) return;
    if (!(pendingActivateChannel.channelId in state.tabs)) return;
    actions.setActiveTab(pendingActivateChannel.channelId);
    navActions.clearPendingActivate();
  }, [pendingActivateChannel, state.tabs, cwd]);

  // Consume pendingOpenWorktree intent — sidebar clicked a worktree row.
  // Fires when projectCwd matches our own; finds an existing tab with
  // matching cwd and switches, else creates a new tab on that worktree.
  const pendingOpenWorktree = navState?.pendingOpenWorktree ?? null;
  // biome-ignore lint/correctness/useExhaustiveDependencies: same reasoning as pendingActivateChannel effect — actions identity is stable
  useEffect(() => {
    if (!pendingOpenWorktree || !navActions) return;
    if (pendingOpenWorktree.projectCwd !== cwd) return;
    const existingId = pendingOpenWorktree.forceNew
      ? undefined
      : Object.entries(state.tabs).find(
          ([, meta]) => meta.cwd === pendingOpenWorktree.worktreeCwd,
        )?.[0];
    if (existingId) {
      actions.setActiveTab(existingId);
    } else {
      // Mockup's openWt: when no matching tab exists, create one (open-or-switch).
      // Duplicate-tab creation stays behind ⋯ menu "Open in new chat" (forceNew=true).
      actions.createNewTab({ cwd: pendingOpenWorktree.worktreeCwd });
    }
    navActions.clearPendingOpenWorktree();
  }, [pendingOpenWorktree, state.tabs, cwd]);

  return (
    <TabStateContext.Provider value={state}>
      <TabActionsContext.Provider value={actions}>{children}</TabActionsContext.Provider>
    </TabStateContext.Provider>
  );
}
