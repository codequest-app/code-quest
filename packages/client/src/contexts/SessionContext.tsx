import type { SessionSummary } from '@code-quest/shared';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { rpc } from '../socket/rpc';
import { useSocket } from './SocketContext';

export interface AuthState {
  status: 'idle' | 'waiting' | 'code' | 'success' | 'error';
  authUrl: string | null;
  errorMsg: string | null;
}

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

  // ── Auth ──
  auth: AuthState;
  login: () => void;
  submitOAuthCode: (code: string, state?: string) => void;
  resetAuth: () => void;
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
  const [auth, setAuth] = useState<AuthState>({ status: 'idle', authUrl: null, errorMsg: null });

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

  useEffect(() => {
    const onAuthUrl = (payload: { channelId: string; url: string; method: string }) => {
      setAuth((prev) => ({ ...prev, status: 'code', authUrl: payload.url }));
    };
    socket.on('notification:auth_url', onAuthUrl);
    return () => {
      socket.off('notification:auth_url', onAuthUrl);
    };
  }, [socket]);

  const actions = useMemo<Omit<SessionContextValue, 'initOptions' | 'auth'>>(
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
      login: () => {
        setAuth({ status: 'waiting', authUrl: null, errorMsg: null });
        socket.emit('login', { method: 'oauth' }, (res) => {
          if (!res.success) {
            setAuth({ status: 'error', authUrl: null, errorMsg: res.error ?? 'Login failed' });
          }
        });
      },
      submitOAuthCode: (code: string, state?: string) => {
        setAuth((prev) => ({ ...prev, status: 'waiting' }));
        socket.emit('submit_oauth_code', { code, state }, (res) => {
          if (res.success) {
            setAuth({ status: 'success', authUrl: null, errorMsg: null });
          } else {
            setAuth((prev) => ({
              ...prev,
              status: 'error',
              errorMsg: res.error ?? 'OAuth failed',
            }));
          }
        });
      },
      resetAuth: () => setAuth({ status: 'idle', authUrl: null, errorMsg: null }),
    }),
    [socket],
  );

  const value: SessionContextValue = useMemo(
    () => ({ initOptions, auth, ...actions }),
    [initOptions, auth, actions],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
