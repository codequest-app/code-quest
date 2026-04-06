import {
  initResponseSchema,
  type SessionStateSummary,
  sessionCreatedPayloadSchema,
  sessionDeadPayloadSchema,
  sessionResumePayloadSchema,
} from '@code-quest/shared';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import type { SessionStatus } from '../types/ui';
import { useSocket } from './SocketContext';

export interface TabMeta {
  title?: string;
  tabStatus: SessionStatus;
  cwd?: string;
}

interface TabState {
  tabs: Record<string, TabMeta>;
  activeTabId: string | null;
}

export interface TabContextValue {
  tabs: Record<string, TabMeta>;
  activeTabId: string | null;
  addTab: (id: string) => void;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  setTabTitle: (id: string, title: string) => void;
  setTabStatus: (id: string, status: TabMeta['tabStatus']) => void;
  createNewTab: (opts?: { cwd?: string }) => { channelId: string };
  replaceActiveTab: (newChannelId: string) => void;
  syncFromServer: (sessions: SessionStateSummary[]) => void;
}

const TabContext = createContext<TabContextValue | null>(null);

export function useTab(): TabContextValue {
  const ctx = useContext(TabContext);
  if (!ctx) throw new Error('useTab must be used within a TabProvider');
  return ctx;
}

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
  const [state, setState] = useState<TabState>(() => ({
    tabs: initialState?.tabs ?? {},
    activeTabId: initialState?.activeTabId ?? null,
  }));

  const { socket } = useSocket();

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
        next[s.channelId] = prev.tabs[s.channelId] ?? { ...DEFAULT_META };
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: actions stable via React Compiler
  useEffect(() => {
    const onConnect = initialState
      ? undefined
      : () => {
          socket.emit('app:init', (raw) => {
            const parsed = initResponseSchema.safeParse(raw);
            if (parsed.success) {
              syncFromServer(parsed.data.sessions);
            }
          });
        };

    const onCreated = (raw: unknown) => {
      const parsed = sessionCreatedPayloadSchema.safeParse(raw);
      if (!parsed.success) return;
      addTab(parsed.data.channelId);
    };

    const onDead = (raw: unknown) => {
      const parsed = sessionDeadPayloadSchema.safeParse(raw);
      if (!parsed.success) return;
      removeTab(parsed.data.channelId);
    };

    const onResume = (raw: unknown) => {
      const parsed = sessionResumePayloadSchema.safeParse(raw);
      if (!parsed.success) return;
      replaceActiveTab(parsed.data.channelId);
    };

    if (onConnect) {
      socket.on('connect', onConnect);
      if (socket.connected) onConnect();
    }
    socket.on('session:created', onCreated);
    socket.on('session:dead', onDead);
    socket.on('session:resume', onResume);

    return () => {
      if (onConnect) socket.off('connect', onConnect);
      socket.off('session:created', onCreated);
      socket.off('session:dead', onDead);
      socket.off('session:resume', onResume);
    };
  }, [socket, initialState]);

  // Document title side effect
  const activeMeta = state.activeTabId ? state.tabs[state.activeTabId] : undefined;
  useEffect(() => {
    const isBusy = activeMeta?.tabStatus === 'processing' || activeMeta?.tabStatus === 'busy';
    document.title = isBusy ? '⟳ Code Quest' : 'Code Quest';
  }, [activeMeta?.tabStatus]);

  return (
    <TabContext.Provider
      value={{
        tabs: state.tabs,
        activeTabId: state.activeTabId,
        addTab,
        removeTab,
        setActiveTab,
        setTabTitle,
        setTabStatus,
        createNewTab,
        replaceActiveTab,
        syncFromServer,
      }}
    >
      {children}
    </TabContext.Provider>
  );
}
