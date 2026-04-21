import { type SessionStateSummary, sessionBroadcastStateSchema } from '@code-quest/shared';
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react';
import type { SessionStatus } from '../types/ui';
// Intentional dependency — Decision 10: ProjectContext mediates the
// "activate this channel for cwd X" intent across the sidebar/editor split.
// Soft-bound: TabProvider may be mounted standalone in tests, so we read
// the contexts directly and treat absence as "no pending intent".
import { ProjectActionsContext, ProjectStateContext } from './ProjectContext';

interface TabMeta {
  title?: string;
  tabStatus: SessionStatus;
  cwd?: string;
}

// ── State context (changes frequently) ──

interface TabStateValue {
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

interface TabActionsValue {
  addTab: (id: string, cwd?: string) => void;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  setTabTitle: (id: string, title: string) => void;
  setTabStatus: (id: string, status: TabMeta['tabStatus']) => void;
  createNewTab: (opts?: { cwd?: string }) => { channelId: string };
  replaceActiveTab: (newChannelId: string) => void;
  replaceTab: (oldChannelId: string, newChannelId: string) => void;
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

  // cwd prop is read inside stable actions via ref so actions keep a single
  // identity across renders (otherwise downstream memoization breaks).
  const cwdRef = useRef(cwd);
  cwdRef.current = cwd;

  const [actions] = useState<TabActionsValue>(() => ({
    addTab: (id, cwd) => {
      setState((prev) => {
        if (id in prev.tabs) return prev;
        const tabs = { ...prev.tabs, [id]: { ...DEFAULT_META, cwd } };
        return { tabs, activeTabId: prev.activeTabId ?? id };
      });
    },
    removeTab: (id) => {
      setState((prev) => {
        if (!(id in prev.tabs)) return prev;
        const { [id]: _, ...rest } = prev.tabs;
        const wasActive = prev.activeTabId === id;
        const activeTabId = wasActive ? (Object.keys(rest)[0] ?? null) : prev.activeTabId;
        return { tabs: rest, activeTabId };
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
      const tabCwd = opts?.cwd ?? cwdRef.current;
      setState((prev) => ({
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
          tabs: { ...rest, [newChannelId]: DEFAULT_META },
          activeTabId: newChannelId,
        };
      });
    },
    replaceTab: (oldChannelId, newChannelId) => {
      setState((prev) => {
        if (!(oldChannelId in prev.tabs)) return prev;
        const { [oldChannelId]: old, ...rest } = prev.tabs;
        return {
          tabs: { ...rest, [newChannelId]: { ...old } },
          activeTabId: prev.activeTabId === oldChannelId ? newChannelId : prev.activeTabId,
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

  // Decision 10: consume pendingActivateChannel intent from ProjectContext.
  // Fires only when (a) the cwd matches our own AND (b) the channel is
  // already in our tabs. Otherwise we wait — the sessions-prop effect above
  // may add the channel later, and this effect will re-run via the tabs dep.
  // Dep array MUST include both pendingActivateChannel AND state.tabs,
  // otherwise a pending intent that lands before auto-addTab is silently lost.
  const projectState = useContext(ProjectStateContext);
  const projectActions = useContext(ProjectActionsContext);
  const pendingActivateChannel = projectState?.pendingActivateChannel ?? null;
  // biome-ignore lint/correctness/useExhaustiveDependencies: setActiveTab is a local closure that only calls setState; projectActions identity is preserved by ProjectProvider's useState initializer (see ProjectContext.tsx)
  useEffect(() => {
    if (!pendingActivateChannel || !projectActions) return;
    if (pendingActivateChannel.cwd !== cwd) return;
    if (!(pendingActivateChannel.channelId in state.tabs)) return;
    actions.setActiveTab(pendingActivateChannel.channelId);
    projectActions.clearPendingActivate();
  }, [pendingActivateChannel, state.tabs, cwd]);

  return (
    <TabStateContext.Provider value={state}>
      <TabActionsContext.Provider value={actions}>{children}</TabActionsContext.Provider>
    </TabStateContext.Provider>
  );
}
