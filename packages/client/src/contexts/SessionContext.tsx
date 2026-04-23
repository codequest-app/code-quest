import type {
  Ack,
  ForkConversationResponse,
  RpcResult,
  SessionStateSummary,
  SessionStatesPayload,
  SessionSummary,
  TeleportSessionResponse,
} from '@code-quest/shared';
import {
  EVENTS,
  initResponseSchema,
  sessionCreatedPayloadSchema,
  sessionDeadPayloadSchema,
  sessionResumeResponseSchema,
  sessionStatesPayloadSchema,
} from '@code-quest/shared';
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { rpc } from '../socket/rpc';
import { useSocket } from './SocketContext';

interface AuthState {
  status: 'idle' | 'waiting' | 'code' | 'success' | 'error';
  authUrl: string | null;
  errorMsg: string | null;
}

interface SessionContextValue {
  // ── Session actions ──
  listSessions: (opts?: {
    limit?: number;
    offset?: number;
    cwd?: string;
    excludeLive?: boolean;
  }) => Promise<RpcResult<{ sessions: SessionSummary[]; total: number }>>;
  listRemoteSessions: (opts?: {
    limit?: number;
    offset?: number;
  }) => Promise<RpcResult<{ sessions: SessionSummary[]; total: number }>>;
  getSession: (channelId: string) => Promise<RpcResult<{ session: SessionSummary }>>;
  forkSession: (
    forkedFromChannelId: string,
    resumeSessionAt: string,
  ) => Promise<ForkConversationResponse>;
  teleportSession: (remoteChannelId: string, branch?: string) => Promise<TeleportSessionResponse>;
  renameSession: (channelId: string, title: string) => Promise<Ack>;
  deleteSession: (channelId: string) => Promise<Ack>;
  updateSessionState: (
    channelId: string,
    update: { title?: string; state?: 'busy' | 'idle' },
  ) => Promise<Ack>;

  closeSession: (channelId: string) => void;
  /** Resume a historical session by its sessionId. Server reuses a live
   *  channel if one already wraps this sessionId; otherwise spawns. */
  resume: (sessionId: string) => Promise<{ channelId: string }>;

  // ── Live session list (from app:init + broadcasts) ──
  sessions: SessionStateSummary[];

  // ── Auth ──
  auth: AuthState;
  login: () => void;
  submitOAuthCode: (code: string, state?: string) => void;
  resetAuth: () => void;

  /** Register a listener that fires synchronously when a `session:states`
   * broadcast arrives, before React batches the `sessions` state update.
   * Use this when subscribers need the same sync timing as a direct
   * `socket.on(EVENTS.session.states, ...)` (e.g., a joinedRef gate that must
   * reflect pre-join vs post-join distinction). */
  subscribeSessionStates: (cb: (payload: SessionStatesPayload) => void) => () => void;
}

type SessionStateValue = Pick<SessionContextValue, 'auth' | 'sessions'>;
type SessionActionsValue = Omit<SessionContextValue, keyof SessionStateValue>;

export const SessionStateContext = createContext<SessionStateValue | null>(null);
const SessionActionsContext = createContext<SessionActionsValue | null>(null);

export function useSession(): SessionContextValue {
  const state = useContext(SessionStateContext);
  const actions = useContext(SessionActionsContext);
  if (!state || !actions) throw new Error('useSession must be used within a SessionProvider');
  return { ...state, ...actions };
}

type SessionUpdater = (prev: SessionStateSummary[]) => SessionStateSummary[];

function handleCreated(raw: unknown): SessionUpdater | null {
  const parsed = sessionCreatedPayloadSchema.safeParse(raw);
  if (!parsed.success) return null;
  const { channelId, cwd, projectRoot } = parsed.data;
  return (prev) => {
    if (prev.some((s) => s.channelId === channelId)) return prev;
    return [...prev, { channelId, state: 'launching', cwd, projectRoot }];
  };
}

function handleDead(raw: unknown): SessionUpdater | null {
  const parsed = sessionDeadPayloadSchema.safeParse(raw);
  if (!parsed.success) return null;
  return (prev) => prev.filter((s) => s.channelId !== parsed.data.channelId);
}

function handleStates(raw: unknown): SessionUpdater | null {
  const parsed = sessionStatesPayloadSchema.safeParse(raw);
  if (!parsed.success) return null;
  return (prev) => {
    let next = [...prev];
    for (const update of parsed.data.sessions) {
      const idx = next.findIndex((s) => s.channelId === update.channelId);
      if (idx >= 0) {
        next[idx] = { ...next[idx], ...update };
      } else {
        next = [...next, update];
      }
    }
    return next;
  };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const { socket } = useSocket();

  const [auth, setAuth] = useState<AuthState>({ status: 'idle', authUrl: null, errorMsg: null });
  const [sessions, setSessions] = useState<SessionStateSummary[]>([]);

  const sessionStatesListenersRef = useRef<Set<(p: SessionStatesPayload) => void>>(new Set());

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
    socket.on(EVENTS.notification.auth_url, onAuthUrl);
    return () => {
      socket.off(EVENTS.notification.auth_url, onAuthUrl);
    };
  }, [socket]);

  // app:init + session:* broadcasts — maintain the live session list.
  useEffect(() => {
    const onConnect = () => {
      socket.emit(EVENTS.app.init, (raw) => {
        const parsed = initResponseSchema.safeParse(raw);
        if (!parsed.success) return;
        setSessions(parsed.data.sessions);
      });
    };

    const apply = (handler: (raw: unknown) => SessionUpdater | null) => (raw: unknown) => {
      const updater = handler(raw);
      if (updater) setSessions(updater);
    };
    const onCreated = apply(handleCreated);
    const onDead = apply(handleDead);
    const onStates = (raw: unknown) => {
      const parsed = sessionStatesPayloadSchema.safeParse(raw);
      if (parsed.success) setSessions(handleStates(raw) ?? ((prev) => prev));
      // Sync fan-out: listeners see the event at the socket.on tick (before
      // React batches setSessions), preserving a joinedRef-style gate that
      // distinguishes pre-join vs post-join events.
      const payload = parsed.success ? parsed.data : (raw as SessionStatesPayload);
      for (const listener of sessionStatesListenersRef.current) listener(payload);
    };

    socket.on('connect', onConnect);
    if (socket.connected) onConnect();
    socket.on(EVENTS.session.created, onCreated);
    socket.on(EVENTS.session.dead, onDead);
    socket.on(EVENTS.session.states, onStates);
    return () => {
      socket.off('connect', onConnect);
      socket.off(EVENTS.session.created, onCreated);
      socket.off(EVENTS.session.dead, onDead);
      socket.off(EVENTS.session.states, onStates);
    };
  }, [socket]);

  const [actions] = useState<SessionActionsValue>(() => ({
    listSessions: (opts) => rpc(socket, EVENTS.session.list, opts ?? {}),
    listRemoteSessions: (opts) => rpc(socket, EVENTS.session.list_remote, opts ?? {}),
    getSession: (channelId) => rpc(socket, EVENTS.session.get, { channelId }),
    forkSession: (forkedFromChannelId, resumeSessionAt) =>
      rpc(socket, EVENTS.session.fork, {
        forkedFromChannelId,
        resumeSessionAt,
        newChannelId: crypto.randomUUID(),
      }),
    teleportSession: (remoteChannelId, branch) =>
      rpc(socket, EVENTS.session.teleport, {
        remoteChannelId,
        branch,
        newChannelId: crypto.randomUUID(),
      }),
    renameSession: (channelId, title) => rpc(socket, EVENTS.session.rename, { channelId, title }),
    deleteSession: (channelId) => rpc(socket, EVENTS.session.delete, { channelId }),
    updateSessionState: (channelId, update) =>
      rpc(socket, EVENTS.session.update_state, { channelId, ...update }),
    closeSession: (channelId: string) => {
      socket.emit(EVENTS.session.close, { channelId });
    },
    resume: (sessionId: string) =>
      new Promise<{ channelId: string }>((resolve, reject) => {
        socket.emit(EVENTS.session.resume, { sessionId }, (raw: unknown) => {
          const parsed = sessionResumeResponseSchema.safeParse(raw);
          if (!parsed.success) {
            reject(new Error('Invalid response'));
            return;
          }
          if (!parsed.data.ok) {
            reject(new Error(parsed.data.error));
            return;
          }
          resolve({ channelId: parsed.data.data.channelId });
        });
      }),
    login: () => {
      setAuth({ status: 'waiting', authUrl: null, errorMsg: null });
      socket.emit(EVENTS.auth.login, { method: 'oauth' }, (res) => {
        if (!res.ok) {
          setAuth({ status: 'error', authUrl: null, errorMsg: res.error ?? 'Login failed' });
        }
      });
    },
    submitOAuthCode: (code: string, state?: string) => {
      setAuth((prev) => ({ ...prev, status: 'waiting' }));
      socket.emit(EVENTS.auth.oauth_code, { code, state }, (res) => {
        if (res.ok) {
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
    subscribeSessionStates: (cb) => {
      sessionStatesListenersRef.current.add(cb);
      return () => {
        sessionStatesListenersRef.current.delete(cb);
      };
    },
  }));

  return (
    <SessionActionsContext.Provider value={actions}>
      <SessionStateContext.Provider value={{ auth, sessions }}>
        {children}
      </SessionStateContext.Provider>
    </SessionActionsContext.Provider>
  );
}
