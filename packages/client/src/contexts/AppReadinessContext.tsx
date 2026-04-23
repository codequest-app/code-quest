import { EVENTS, initResponseSchema } from '@code-quest/shared';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { useSocket } from './SocketContext';

interface AppReadinessState {
  /** Feature flags derived from server `app:init` — e.g., whether git
   *  worktree operations are available. */
  capabilities: { worktree: boolean };
  /** Server-side default launch options echoed on `app:init` (model,
   *  permissionMode, …). Compose toolbar reads/merges these. */
  initOptions: Record<string, unknown>;
}

interface AppReadinessActions {
  setInitOptions: (opts: Record<string, unknown>) => void;
}

export const AppReadinessStateContext = createContext<AppReadinessState | null>(null);
const AppReadinessActionsContext = createContext<AppReadinessActions | null>(null);

export function useAppReadinessState(): AppReadinessState {
  const ctx = useContext(AppReadinessStateContext);
  if (!ctx) throw new Error('useAppReadinessState must be used within AppReadinessProvider');
  return ctx;
}

export function useAppReadinessActions(): AppReadinessActions {
  const ctx = useContext(AppReadinessActionsContext);
  if (!ctx) throw new Error('useAppReadinessActions must be used within AppReadinessProvider');
  return ctx;
}

/** Convenience: `{ capabilities, initOptions, setInitOptions }` in one call. */
export function useAppReadiness(): AppReadinessState & AppReadinessActions {
  return { ...useAppReadinessState(), ...useAppReadinessActions() };
}

export function AppReadinessProvider({ children }: { children: ReactNode }) {
  const { socket } = useSocket();
  const [capabilities, setCapabilities] = useState<{ worktree: boolean }>({ worktree: false });
  const [initOptions, setInitOptions] = useState<Record<string, unknown>>({});

  useEffect(() => {
    const onConnect = () => {
      socket.emit(EVENTS.app.init, (raw) => {
        const parsed = initResponseSchema.safeParse(raw);
        if (!parsed.success) return;
        if (parsed.data.capabilities) setCapabilities(parsed.data.capabilities);
        if (parsed.data.settings && Object.keys(parsed.data.settings).length > 0) {
          setInitOptions(parsed.data.settings);
        }
      });
    };
    socket.on('connect', onConnect);
    if (socket.connected) onConnect();
    return () => {
      socket.off('connect', onConnect);
    };
  }, [socket]);

  const [actions] = useState<AppReadinessActions>(() => ({
    setInitOptions: (opts) => setInitOptions(opts),
  }));

  return (
    <AppReadinessStateContext.Provider value={{ capabilities, initOptions }}>
      <AppReadinessActionsContext.Provider value={actions}>
        {children}
      </AppReadinessActionsContext.Provider>
    </AppReadinessStateContext.Provider>
  );
}
