import { createContext, type ReactNode, useContext, useMemo, useState } from 'react';

// State + actions split (matches ProjectContext / TabContext / NavigationContext
// in this codebase). Reader (useActiveCwd) subscribes to state only and
// re-renders on cwd change; writer (useActiveChatTabCwdPublisher in TabContainer)
// subscribes to actions only — setCwd identity is stable, so TabContainer
// does NOT re-render when the cwd state changes.

interface ActiveChatTabCwdState {
  /** cwd of the currently active chat tab in the active project; null when
   *  no project is active OR no chat tab is open in the active project. */
  cwd: string | null;
}

interface ActiveChatTabCwdActions {
  setCwd: (cwd: string | null) => void;
}

export const ActiveChatTabCwdStateContext = createContext<ActiveChatTabCwdState | null>(null);
export const ActiveChatTabCwdActionsContext = createContext<ActiveChatTabCwdActions | null>(null);

/** Soft-bound reader. Returns null when used outside a provider so consumers
 *  can fall through gracefully (matches `useActiveCwd`'s aggregate pattern). */
export function useActiveChatTabCwdState(): ActiveChatTabCwdState | null {
  return useContext(ActiveChatTabCwdStateContext);
}

/** Soft-bound writer. Returns null outside a provider; publisher can no-op. */
export function useActiveChatTabCwdActions(): ActiveChatTabCwdActions | null {
  return useContext(ActiveChatTabCwdActionsContext);
}

export function ActiveChatTabCwdProvider({ children }: { children: ReactNode }) {
  const [cwd, setCwd] = useState<string | null>(null);
  // setCwd from useState is identity-stable; empty dep array makes the
  // actions object an effective once-and-done allocation.
  const actions = useMemo<ActiveChatTabCwdActions>(() => ({ setCwd }), []);
  const state = useMemo<ActiveChatTabCwdState>(() => ({ cwd }), [cwd]);
  return (
    <ActiveChatTabCwdActionsContext.Provider value={actions}>
      <ActiveChatTabCwdStateContext.Provider value={state}>
        {children}
      </ActiveChatTabCwdStateContext.Provider>
    </ActiveChatTabCwdActionsContext.Provider>
  );
}
