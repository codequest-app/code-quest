import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { useSocket } from './SocketContext';

export interface TabMeta {
  title?: string;
  tabStatus: 'default' | 'pending' | 'done';
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
  createNewTab: (initialPrompt?: string) => Promise<{ channelId: string }>;
  replaceActiveTab: (newChannelId: string) => void;
  syncFromServer: (sessions: Array<{ channelId: string; state: string }>) => void;
}

const TabContext = createContext<TabContextValue | null>(null);

export function useTab(): TabContextValue {
  const ctx = useContext(TabContext);
  if (!ctx) throw new Error('useTab must be used within a TabProvider');
  return ctx;
}

const DEFAULT_META: TabMeta = { title: undefined, tabStatus: 'default' };

export function TabProvider({
  children,
  initialState,
  workspaceFolder = '../',
}: {
  children: ReactNode;
  initialState?: { tabs: Record<string, TabMeta>; activeTabId: string | null };
  workspaceFolder?: string;
}) {
  const [state, setState] = useState<TabState>(() => ({
    tabs: initialState?.tabs ?? {},
    activeTabId: initialState?.activeTabId ?? null,
  }));

  const { socket } = useSocket();

  const actions = useMemo(() => {
    const addTab = (id: string) => {
      setState((prev) => {
        if (id in prev.tabs) return prev;
        return { ...prev, tabs: { ...prev.tabs, [id]: DEFAULT_META } };
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
            prev.activeTabId === id
              ? remaining.length > 0
                ? remaining[0]
                : null
              : prev.activeTabId,
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

    const createNewTab = (initialPrompt?: string) =>
      new Promise<{ channelId: string }>((resolve) => {
        const clientId = crypto.randomUUID();
        setState((prev) => ({
          tabs: { ...prev.tabs, [clientId]: DEFAULT_META },
          activeTabId: clientId,
        }));
        socket.emit(
          'session:launch',
          { initialPrompt, channelId: clientId, cwd: workspaceFolder },
          (_response: { channelId: string; slashCommands?: string[] }) => {
            resolve({ channelId: clientId });
          },
        );
      });

    const syncFromServer = (sessions: Array<{ channelId: string; state: string }>) => {
      const serverIds = new Set(sessions.map((s) => s.channelId));
      setState((prev) => {
        const next: Record<string, TabMeta> = {};
        for (const id of Object.keys(prev.tabs)) {
          if (serverIds.has(id)) next[id] = prev.tabs[id];
        }
        for (const s of sessions) {
          if (!(s.channelId in next)) next[s.channelId] = DEFAULT_META;
        }
        const activeTabId =
          prev.activeTabId && serverIds.has(prev.activeTabId)
            ? prev.activeTabId
            : sessions.length > 0
              ? sessions[0].channelId
              : null;
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

    return {
      addTab,
      removeTab,
      setActiveTab,
      setTabTitle,
      setTabStatus,
      createNewTab,
      replaceActiveTab,
      syncFromServer,
    };
  }, [socket, workspaceFolder]);

  useEffect(() => {
    const onConnect = initialState
      ? undefined
      : () => {
          socket.emit('app:init', (res) => {
            if (res.sessions && Array.isArray(res.sessions)) {
              actions.syncFromServer(res.sessions);
            }
          });
        };

    const onCreated = ({ channelId }: { channelId: string }) => {
      setState((prev) => ({
        tabs: channelId in prev.tabs ? prev.tabs : { ...prev.tabs, [channelId]: DEFAULT_META },
        activeTabId: prev.activeTabId ?? channelId,
      }));
    };

    const onDead = ({ channelId }: { channelId: string }) => {
      actions.removeTab(channelId);
    };

    const onResume = ({ channelId }: { channelId: string }) => {
      actions.replaceActiveTab(channelId);
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
  }, [socket, actions, initialState]);

  // Document title side effect
  const activeMeta = state.activeTabId ? state.tabs[state.activeTabId] : undefined;
  useEffect(() => {
    document.title = activeMeta?.tabStatus === 'pending' ? '⟳ Code Quest' : 'Code Quest';
  }, [activeMeta?.tabStatus]);

  const value = useMemo<TabContextValue>(
    () => ({
      tabs: state.tabs,
      activeTabId: state.activeTabId,
      ...actions,
    }),
    [state, actions],
  );

  return <TabContext.Provider value={value}>{children}</TabContext.Provider>;
}
