import type { SessionSummary } from '@code-quest/shared';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { rpc } from '../socket/rpc';
import { useSocket } from './SocketContext';

export interface SessionContextValue {
  // ── Session actions ──
  listSessions: (opts?: {
    limit?: number;
    offset?: number;
  }) => Promise<{ sessions: SessionSummary[]; total: number }>;
  listRemoteSessions: (opts?: {
    limit?: number;
    offset?: number;
  }) => Promise<{ sessions: SessionSummary[]; total: number }>;
  getSession: (channelId: string) => Promise<{ session: SessionSummary } | { error: string }>;
  forkSession: (
    forkedFromSession: string,
    resumeSessionAt: string,
  ) => Promise<{ success: boolean; sessionId?: string; error?: string }>;
  teleportSession: (
    remoteSessionId: string,
    branch?: string,
  ) => Promise<{ success: boolean; sessionId?: string; error?: string }>;
  renameSession: (
    channelId: string,
    title: string,
  ) => Promise<{ success: boolean; error?: string }>;
  deleteSession: (channelId: string) => Promise<{ success: boolean; error?: string }>;
  updateSessionState: (
    channelId: string,
    update: { title?: string; state?: 'busy' | 'idle' },
  ) => Promise<{ success: boolean; error?: string }>;

  initOptions: Record<string, unknown>;
  setInitOptions: (opts: Record<string, unknown>) => void;
}

export const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  return ctx;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const { socket } = useSocket();

  const [initOptions, setInitOptions] = useState<Record<string, unknown>>({});

  useEffect(() => {
    const onConnect = () => {
      socket.emit('init', (res) => {
        if (res.settings && Object.keys(res.settings).length > 0) {
          setInitOptions((prev) => ({ ...prev, ...res.settings }));
        }
      });
    };
    socket.on('connect', onConnect);
    socket.connect();
    return () => {
      socket.off('connect', onConnect);
    };
  }, [socket]);

  const actions = useMemo<Omit<SessionContextValue, 'initOptions'>>(
    () => ({
      setInitOptions,
      listSessions: (opts) => rpc(socket, 'list_sessions_request', opts ?? {}),
      listRemoteSessions: (opts) => rpc(socket, 'list_remote_sessions', opts ?? {}),
      getSession: (channelId) => rpc(socket, 'get_session_request', { channelId }),
      forkSession: (forkedFromSession, resumeSessionAt) =>
        rpc(socket, 'fork_conversation', {
          forkedFromSession,
          resumeSessionAt,
          newSessionId: crypto.randomUUID(),
        }),
      teleportSession: (remoteSessionId, branch) =>
        rpc(socket, 'teleport_session', {
          remoteSessionId,
          branch,
          newSessionId: crypto.randomUUID(),
        }),
      renameSession: (channelId, title) => rpc(socket, 'rename_session', { channelId, title }),
      deleteSession: (channelId) => rpc(socket, 'delete_session', { channelId }),
      updateSessionState: (channelId, update) =>
        rpc(socket, 'update_session_state', { channelId, ...update }),
    }),
    [socket],
  );

  const value: SessionContextValue = useMemo(
    () => ({ initOptions, ...actions }),
    [initOptions, actions],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
