import type {
  ForkConversationResponse,
  SessionSummary,
  TeleportSessionResponse,
} from '@code-quest/shared';
import { sessionResumeResponseSchema } from '@code-quest/shared';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { rpc } from '../socket/rpc';
import { useSocket } from './SocketContext';

interface AuthState {
  status: 'idle' | 'waiting' | 'code' | 'success' | 'error';
  authUrl: string | null;
  errorMsg: string | null;
}

export interface SessionContextValue {
  // ── Session actions ──
  listSessions: (opts?: {
    limit?: number;
    offset?: number;
    cwd?: string;
    excludeLive?: boolean;
  }) => Promise<{ sessions: SessionSummary[]; total: number }>;
  listRemoteSessions: (opts?: {
    limit?: number;
    offset?: number;
  }) => Promise<{ sessions: SessionSummary[]; total: number }>;
  getSession: (channelId: string) => Promise<{ session: SessionSummary } | { error: string }>;
  forkSession: (
    forkedFromChannelId: string,
    resumeSessionAt: string,
  ) => Promise<ForkConversationResponse>;
  teleportSession: (remoteChannelId: string, branch?: string) => Promise<TeleportSessionResponse>;
  renameSession: (
    channelId: string,
    title: string,
  ) => Promise<{ success: boolean; error?: string }>;
  deleteSession: (channelId: string) => Promise<{ success: boolean; error?: string }>;
  updateSessionState: (
    channelId: string,
    update: { title?: string; state?: 'busy' | 'idle' },
  ) => Promise<{ success: boolean; error?: string }>;

  closeSession: (channelId: string) => void;
  /** Resume a historical session by its sessionId. Server reuses a live
   *  channel if one already wraps this sessionId; otherwise spawns. */
  resume: (sessionId: string) => Promise<{ channelId: string }>;

  initOptions: Record<string, unknown>;
  setInitOptions: (opts: Record<string, unknown>) => void;

  // ── Auth ──
  auth: AuthState;
  login: () => void;
  submitOAuthCode: (code: string, state?: string) => void;
  resetAuth: () => void;
}

type SessionStateValue = Pick<SessionContextValue, 'initOptions' | 'auth'>;
type SessionActionsValue = Omit<SessionContextValue, keyof SessionStateValue>;

const SessionStateContext = createContext<SessionStateValue | null>(null);
const SessionActionsContext = createContext<SessionActionsValue | null>(null);

export function useSession(): SessionContextValue {
  const state = useContext(SessionStateContext);
  const actions = useContext(SessionActionsContext);
  if (!state || !actions) throw new Error('useSession must be used within a SessionProvider');
  return { ...state, ...actions };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const { socket } = useSocket();

  const [initOptions, setInitOptions] = useState<Record<string, unknown>>({});
  const [auth, setAuth] = useState<AuthState>({ status: 'idle', authUrl: null, errorMsg: null });

  useEffect(() => {
    const onConnectError = (err: Error) => {
      toast.error(`Connection error: ${err.message}`);
    };
    socket.on('connect_error', onConnectError);
    socket.connect();
    return () => {
      socket.off('connect_error', onConnectError);
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

  const [actions] = useState<SessionActionsValue>(() => ({
    setInitOptions,
    listSessions: (opts) => rpc(socket, 'session:list', opts ?? {}),
    listRemoteSessions: (opts) => rpc(socket, 'session:list_remote', opts ?? {}),
    getSession: (channelId) => rpc(socket, 'session:get', { channelId }),
    forkSession: (forkedFromChannelId, resumeSessionAt) =>
      rpc(socket, 'session:fork', {
        forkedFromChannelId,
        resumeSessionAt,
        newChannelId: crypto.randomUUID(),
      }),
    teleportSession: (remoteChannelId, branch) =>
      rpc(socket, 'session:teleport', {
        remoteChannelId,
        branch,
        newChannelId: crypto.randomUUID(),
      }),
    renameSession: (channelId, title) => rpc(socket, 'session:rename', { channelId, title }),
    deleteSession: (channelId) => rpc(socket, 'session:delete', { channelId }),
    updateSessionState: (channelId, update) =>
      rpc(socket, 'session:update_state', { channelId, ...update }),
    closeSession: (channelId: string) => {
      socket.emit('session:close', { channelId });
    },
    resume: (sessionId: string) =>
      new Promise<{ channelId: string }>((resolve, reject) => {
        socket.emit('session:resume', { sessionId }, (raw: unknown) => {
          const parsed = sessionResumeResponseSchema.safeParse(raw);
          if (!parsed.success) {
            reject(new Error('Invalid response'));
            return;
          }
          if (!parsed.data.ok) {
            reject(new Error(parsed.data.error));
            return;
          }
          resolve({ channelId: parsed.data.channelId });
        });
      }),
    login: () => {
      setAuth({ status: 'waiting', authUrl: null, errorMsg: null });
      socket.emit('auth:login', { method: 'oauth' }, (res) => {
        if (!res.success) {
          setAuth({ status: 'error', authUrl: null, errorMsg: res.error ?? 'Login failed' });
        }
      });
    },
    submitOAuthCode: (code: string, state?: string) => {
      setAuth((prev) => ({ ...prev, status: 'waiting' }));
      socket.emit('auth:oauth_code', { code, state }, (res) => {
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
  }));

  return (
    <SessionActionsContext.Provider value={actions}>
      <SessionStateContext.Provider value={{ initOptions, auth }}>
        {children}
      </SessionStateContext.Provider>
    </SessionActionsContext.Provider>
  );
}
