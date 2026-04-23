import { createContext, type ReactNode, useContext, useState } from 'react';

/** Intent: tell a TabProvider scoped to `cwd` to activate `channelId` once it
 *  appears in that provider's tabs. Set by flows that spawn a channel
 *  outside any TabProvider (sidebar, resume flow, dialogs). */
export interface PendingActivateChannel {
  cwd: string;
  channelId: string;
}

/** Intent: tell a TabProvider scoped to `projectCwd` to open (or switch to)
 *  a tab whose cwd is `worktreeCwd`. `forceNew` bypasses switch-to-existing. */
export interface PendingOpenWorktree {
  projectCwd: string;
  worktreeCwd: string;
  forceNew: boolean;
}

interface NavigationState {
  pendingActivateChannel: PendingActivateChannel | null;
  pendingOpenWorktree: PendingOpenWorktree | null;
}

interface NavigationActions {
  requestActivateChannel: (cwd: string, channelId: string) => void;
  clearPendingActivate: () => void;
  requestOpenWorktree: (projectCwd: string, worktreeCwd: string, forceNew?: boolean) => void;
  clearPendingOpenWorktree: () => void;
}

export const NavigationStateContext = createContext<NavigationState | null>(null);
export const NavigationActionsContext = createContext<NavigationActions | null>(null);

export function useNavigationState(): NavigationState {
  const ctx = useContext(NavigationStateContext);
  if (!ctx) throw new Error('useNavigationState must be used within NavigationProvider');
  return ctx;
}

export function useNavigationActions(): NavigationActions {
  const ctx = useContext(NavigationActionsContext);
  if (!ctx) throw new Error('useNavigationActions must be used within NavigationProvider');
  return ctx;
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [pendingActivateChannel, setPendingActivateChannel] =
    useState<PendingActivateChannel | null>(null);
  const [pendingOpenWorktree, setPendingOpenWorktree] = useState<PendingOpenWorktree | null>(null);

  const [actions] = useState<NavigationActions>(() => ({
    requestActivateChannel: (cwd, channelId) => setPendingActivateChannel({ cwd, channelId }),
    clearPendingActivate: () => setPendingActivateChannel(null),
    requestOpenWorktree: (projectCwd, worktreeCwd, forceNew = false) =>
      setPendingOpenWorktree({ projectCwd, worktreeCwd, forceNew }),
    clearPendingOpenWorktree: () => setPendingOpenWorktree(null),
  }));

  return (
    <NavigationStateContext.Provider value={{ pendingActivateChannel, pendingOpenWorktree }}>
      <NavigationActionsContext.Provider value={actions}>
        {children}
      </NavigationActionsContext.Provider>
    </NavigationStateContext.Provider>
  );
}
