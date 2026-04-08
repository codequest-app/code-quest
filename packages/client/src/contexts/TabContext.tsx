import type { SessionStateSummary } from '@code-quest/shared';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import type { SessionStatus } from '../types/ui';

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
  addTab: (id: string) => void;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  setTabTitle: (id: string, title: string) => void;
  setTabStatus: (id: string, status: TabMeta['tabStatus']) => void;
  createNewTab: (opts?: { cwd?: string }) => { channelId: string };
  replaceActiveTab: (newChannelId: string) => void;
  syncFromServer: (sessions: SessionStateSummary[]) => void;
}

const TabActionsContext = createContext<TabActionsValue | null>(null);

export function useTabActions(): TabActionsValue {
  const ctx = useContext(TabActionsContext);
  if (!ctx) throw new Error('useTabActions must be used within a TabProvider');
  return ctx;
}

// ── Provider ──

const DEFAULT_META: TabMeta = { title: undefined, tabStatus: 'connecting' };

export function TabProvider({
  children,
  initialState,
  defaultCwd = '../',
}: {
  children: ReactNode;
  initialState?: { tabs: Record<string, TabMeta>; activeTabId: string | null };
  defaultCwd?: string;
}) {
  const [state, setState] = useState<TabStateValue>(() => ({
    tabs: initialState?.tabs ?? {},
    activeTabId: initialState?.activeTabId ?? null,
  }));

  const addTab = (id: string) => {
    setState((prev) => {
      if (id in prev.tabs) return prev;
      const tabs = { ...prev.tabs, [id]: DEFAULT_META };
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
    const tabCwd = opts?.cwd ?? defaultCwd;
    setState((prev) => ({
      tabs: { ...prev.tabs, [channelId]: { ...DEFAULT_META, cwd: tabCwd } },
      activeTabId: channelId,
    }));
    return { channelId };
  };

  const syncFromServer = (sessions: SessionStateSummary[]) => {
    setState((prev) => {
      const next: Record<string, TabMeta> = {};
      for (const s of sessions) {
        const existing = prev.tabs[s.channelId];
        next[s.channelId] = existing
          ? { ...existing, cwd: s.cwd ?? existing.cwd }
          : { ...DEFAULT_META, cwd: s.cwd };
      }
      const activeTabId =
        prev.activeTabId && prev.activeTabId in next
          ? prev.activeTabId
          : (sessions[0]?.channelId ?? null);
      return { tabs: next, activeTabId };
    });
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
    syncFromServer,
  };

  // Document title side effect
  const activeMeta = state.activeTabId ? state.tabs[state.activeTabId] : undefined;
  useEffect(() => {
    const isBusy = activeMeta?.tabStatus === 'processing' || activeMeta?.tabStatus === 'busy';
    document.title = isBusy ? '⟳ Code Quest' : 'Code Quest';
  }, [activeMeta?.tabStatus]);

  const stateValue: TabStateValue = { tabs: state.tabs, activeTabId: state.activeTabId };

  return (
    <TabStateContext.Provider value={stateValue}>
      <TabActionsContext.Provider value={actions}>{children}</TabActionsContext.Provider>
    </TabStateContext.Provider>
  );
}
