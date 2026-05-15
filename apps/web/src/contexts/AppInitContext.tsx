import { EVENTS, type InitResponse, initResponseSchema } from '@code-quest/schemas';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useSocket } from './SocketContext.tsx';

type InitSubscriber = (data: InitResponse) => void;

interface AppInitState {
  /** Feature flags derived from server `app:init` — e.g., whether git
   *  worktree operations are available. */
  capabilities: { worktree: boolean };
  /** Server-side default launch options echoed on `app:init` (model,
   *  permissionMode, …). Compose toolbar reads/merges these. */
  initOptions: Record<string, unknown>;
}

interface AppInitActions {
  setInitOptions: (opts: Record<string, unknown>) => void;
  subscribeInit: (cb: InitSubscriber) => () => void;
}

export const AppInitStateContext: React.Context<AppInitState | null> =
  createContext<AppInitState | null>(null);
const AppInitActionsContext = createContext<AppInitActions | null>(null);

export function useAppInitState(): AppInitState {
  const ctx = useContext(AppInitStateContext);
  if (!ctx) throw new Error('useAppInitState must be used within AppInitProvider');
  return ctx;
}

export function useAppInitActions(): AppInitActions {
  const ctx = useContext(AppInitActionsContext);
  if (!ctx) throw new Error('useAppInitActions must be used within AppInitProvider');
  return ctx;
}

/** Convenience: `{ capabilities, initOptions, setInitOptions }` in one call. */
export function useAppInit(): AppInitState & AppInitActions {
  return { ...useAppInitState(), ...useAppInitActions() };
}

export function AppInitProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const { socket } = useSocket();
  const [capabilities, setCapabilities] = useState<{ worktree: boolean }>({ worktree: false });
  const [initOptions, setInitOptions] = useState<Record<string, unknown>>({});

  const subscribersRef = useRef(new Set<InitSubscriber>());
  const lastInitRef = useRef<InitResponse | null>(null);

  const subscribeInit = useCallback((cb: InitSubscriber) => {
    subscribersRef.current.add(cb);
    if (lastInitRef.current) cb(lastInitRef.current);
    return () => {
      subscribersRef.current.delete(cb);
    };
  }, []);

  useEffect(() => {
    let pending = false;
    const fetchInit = () => {
      if (pending) return;
      pending = true;
      socket.emit(EVENTS.app.init, (raw) => {
        pending = false;
        const parsed = initResponseSchema.safeParse(raw);
        if (!parsed.success) {
          console.warn('[AppInitContext] initResponseSchema parse failed', parsed.error);
          return;
        }
        lastInitRef.current = parsed.data;
        if (parsed.data.capabilities) setCapabilities(parsed.data.capabilities);
        if (parsed.data.settings && Object.keys(parsed.data.settings).length > 0) {
          setInitOptions(parsed.data.settings);
        }
        for (const sub of subscribersRef.current) sub(parsed.data);
      });
    };
    const resetPending = () => {
      pending = false;
    };
    socket.on('connect', fetchInit);
    socket.on('disconnect', resetPending);
    if (socket.connected) fetchInit();
    return () => {
      socket.off('connect', fetchInit);
      socket.off('disconnect', resetPending);
    };
  }, [socket]);

  const [actions] = useState<AppInitActions>(() => ({
    setInitOptions,
    subscribeInit,
  }));

  return (
    <AppInitStateContext.Provider value={{ capabilities, initOptions }}>
      <AppInitActionsContext.Provider value={actions}>{children}</AppInitActionsContext.Provider>
    </AppInitStateContext.Provider>
  );
}
