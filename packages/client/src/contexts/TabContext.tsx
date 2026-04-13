import type { SessionStateSummary } from '@code-quest/shared';
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react';
import type { SessionStatus } from '../types/ui';
// Intentional dependency — Decision 10: ProjectContext mediates the
// "activate this channel for cwd X" intent across the sidebar/editor split.
// Soft-bound: TabProvider may be mounted standalone in tests, so we read
// the contexts directly and treat absence as "no pending intent".
import { ProjectActionsContext, ProjectStateContext } from './ProjectContext';

export interface TabMeta {
  title?: string;
  tabStatus: SessionStatus;
  cwd?: string;
}

// ── State context (changes frequently) ──

export interface TabStateValue {
  tabs: Record<string, TabMeta>;
  activeTabId: string | null;
}

const TabStateContext = createContext<TabStateValue | null>(null);

export function useTabState(): TabStateValue {
  const ctx = useContext(TabStateContext);
  if (!ctx) throw new Error('useTabState must be used within a TabProvider');
  return ctx;
}

// ── Actions context (stable references) ──

export interface TabActionsValue {
  addTab: (id: string, cwd?: string) => void;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  setTabTitle: (id: string, title: string) => void;
  setTabStatus: (id: string, status: TabMeta['tabStatus']) => void;
  createNewTab: (opts?: { cwd?: string }) => { channelId: string };
  replaceActiveTab: (newChannelId: string) => void;
}

const TabActionsContext = createContext<TabActionsValue | null>(null);

export function useTabActions(): TabActionsValue {
  const ctx = useContext(TabActionsContext);
  if (!ctx) throw new Error('useTabActions must be used within a TabProvider');
  return ctx;
}

// ── Provider ──

const DEFAULT_META: TabMeta = { title: undefined, tabStatus: 'connecting' };
const TERMINAL_STATES = new Set(['exited', 'disconnected']);

export function TabProvider({
  children,
  initialState,
  sessions,
  cwd,
}: {
  children: ReactNode;
  initialState?: { tabs: Record<string, TabMeta>; activeTabId: string | null };
  sessions?: SessionStateSummary[];
  cwd?: string;
}) {
  const [state, setState] = useState<TabStateValue>(() => ({
    tabs: initialState?.tabs ?? {},
    activeTabId: initialState?.activeTabId ?? null,
  }));

  const addTab = (id: string, cwd?: string) => {
    setState((prev) => {
      if (id in prev.tabs) return prev;
      const tabs = { ...prev.tabs, [id]: { ...DEFAULT_META, cwd } };
      return { tabs, activeTabId: prev.activeTabId ?? id };
    });
  };

  const removeTab = (id: string) => {
    setState((prev) => {
      if (!(id in prev.tabs)) return prev;
      const { [id]: _, ...rest } = prev.tabs;
      const remaining = Object.keys(rest);
      return {
        tabs: rest,
        activeTabId:
          prev.activeTabId === id ? (remaining.length > 0 ? remaining[0] : null) : prev.activeTabId,
      };
    });
  };

  const setActiveTab = (id: string) => {
    setState((prev) => (prev.activeTabId === id ? prev : { ...prev, activeTabId: id }));
  };

  const setTabTitle = (id: string, title: string) => {
    setState((prev) => {
      const existing = prev.tabs[id];
      if (!existing) return prev;
      return { ...prev, tabs: { ...prev.tabs, [id]: { ...existing, title } } };
    });
  };

  const setTabStatus = (id: string, status: TabMeta['tabStatus']) => {
    setState((prev) => {
      const existing = prev.tabs[id];
      if (!existing) return prev;
      return { ...prev, tabs: { ...prev.tabs, [id]: { ...existing, tabStatus: status } } };
    });
  };

  const createNewTab = (opts?: { cwd?: string }): { channelId: string } => {
    const channelId = crypto.randomUUID();
    const tabCwd = opts?.cwd ?? cwd;
    setState((prev) => ({
      tabs: { ...prev.tabs, [channelId]: { ...DEFAULT_META, cwd: tabCwd } },
      activeTabId: channelId,
    }));
    return { channelId };
  };

  const replaceActiveTab = (newChannelId: string) => {
    setState((prev) => {
      if (!prev.activeTabId) return prev;
      const { [prev.activeTabId]: _, ...rest } = prev.tabs;
      return {
        tabs: { ...rest, [newChannelId]: DEFAULT_META },
        activeTabId: newChannelId,
      };
    });
  };

  const actions: TabActionsValue = {
    addTab,
    removeTab,
    setActiveTab,
    setTabTitle,
    setTabStatus,
    createNewTab,
    replaceActiveTab,
  };

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
      replaceActiveTab(added[0].channelId);
    } else {
      for (const s of added) {
        addTab(s.channelId);
      }
      for (const id of removed) {
        removeTab(id);
      }
    }
    prevSessionIds.current = currentIds;
  }, [sessions]);

  // Decision 10: consume pendingActivateChannel intent from ProjectContext.
  // Fires only when (a) the cwd matches our own AND (b) the channel is
  // already in our tabs. Otherwise we wait — the sessions-prop effect above
  // may add the channel later, and this effect will re-run via the tabs dep.
  // Dep array MUST include both pendingActivateChannel AND state.tabs,
  // otherwise a pending intent that lands before auto-addTab is silently lost.
  const projectState = useContext(ProjectStateContext);
  const projectActions = useContext(ProjectActionsContext);
  const pendingActivateChannel = projectState?.pendingActivateChannel ?? null;
  // biome-ignore lint/correctness/useExhaustiveDependencies: setActiveTab/clearPendingActivate are stable refs
  useEffect(() => {
    if (!pendingActivateChannel || !projectActions) return;
    if (pendingActivateChannel.cwd !== cwd) return;
    if (!(pendingActivateChannel.channelId in state.tabs)) return;
    setActiveTab(pendingActivateChannel.channelId);
    projectActions.clearPendingActivate();
  }, [pendingActivateChannel, state.tabs, cwd]);

  const stateValue: TabStateValue = { tabs: state.tabs, activeTabId: state.activeTabId };

  return (
    <TabStateContext.Provider value={stateValue}>
      <TabActionsContext.Provider value={actions}>{children}</TabActionsContext.Provider>
    </TabStateContext.Provider>
  );
}
