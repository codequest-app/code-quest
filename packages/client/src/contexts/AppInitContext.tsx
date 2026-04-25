import { EVENTS, initResponseSchema } from '@code-quest/shared';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { useSocket } from './SocketContext';

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
}

export const AppInitStateContext = createContext<AppInitState | null>(null);
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

export function AppInitProvider({ children }: { children: ReactNode }) {
  const { socket } = useSocket();
  const [capabilities, setCapabilities] = useState<{ worktree: boolean }>({ worktree: false });
  const [initOptions, setInitOptions] = useState<Record<string, unknown>>({});

  useEffect(() => {
    const fetchInit = () => {
      socket.emit(EVENTS.app.init, (raw) => {
        const parsed = initResponseSchema.safeParse(raw);
        if (!parsed.success) {
          console.warn('[AppInit] invalid init response shape', parsed.error);
          return;
        }
        if (parsed.data.capabilities) setCapabilities(parsed.data.capabilities);
        if (parsed.data.settings && Object.keys(parsed.data.settings).length > 0) {
          setInitOptions(parsed.data.settings);
        }
      });
    };
    socket.on('connect', fetchInit);
    // Already connected on first mount → no 'connect' event will arrive,
    // so kick off once synchronously. Subsequent reconnects use the listener.
    if (socket.connected) fetchInit();
    return () => {
      socket.off('connect', fetchInit);
    };
  }, [socket]);

  const [actions] = useState<AppInitActions>(() => ({
    setInitOptions: (opts) => setInitOptions(opts),
  }));

  return (
    <AppInitStateContext.Provider value={{ capabilities, initOptions }}>
      <AppInitActionsContext.Provider value={actions}>{children}</AppInitActionsContext.Provider>
    </AppInitStateContext.Provider>
  );
}
