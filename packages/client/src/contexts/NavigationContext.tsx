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
  /** Sidebar's currently-selected worktree, per project. Drives:
   *  - useActiveCwd fallback when no chat tab is open in the active project
   *    (the right pane previews the sidebar selection until the user starts
   *    chatting in a tab, at which point ActiveChatTabCwdContext takes over)
   *  - TabProvider's createNewTab default cwd
   *  Selecting a worktree DOES NOT auto-open chat — user clicks `+` for that. */
  selectedWorktreeCwd: Record<string, string | null>;
}

interface NavigationActions {
  requestActivateChannel: (cwd: string, channelId: string) => void;
  clearPendingActivate: () => void;
  requestOpenWorktree: (projectCwd: string, worktreeCwd: string, forceNew?: boolean) => void;
  clearPendingOpenWorktree: () => void;
  /** Set/clear which worktree the sidebar has highlighted under the given project. */
  setSelectedWorktree: (projectCwd: string, worktreeCwd: string | null) => void;
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
  const [selectedWorktreeCwd, setSelectedWorktreeCwdState] = useState<
    Record<string, string | null>
  >({});

  const [actions] = useState<NavigationActions>(() => ({
    requestActivateChannel: (cwd, channelId) => setPendingActivateChannel({ cwd, channelId }),
    clearPendingActivate: () => setPendingActivateChannel(null),
    requestOpenWorktree: (projectCwd, worktreeCwd, forceNew = false) =>
      setPendingOpenWorktree({ projectCwd, worktreeCwd, forceNew }),
    clearPendingOpenWorktree: () => setPendingOpenWorktree(null),
    setSelectedWorktree: (projectCwd, worktreeCwd) => {
      setSelectedWorktreeCwdState((prev) => {
        if (worktreeCwd === null) {
          if (!(projectCwd in prev)) return prev;
          const { [projectCwd]: _, ...rest } = prev;
          return rest;
        }
        if (prev[projectCwd] === worktreeCwd) return prev;
        return { ...prev, [projectCwd]: worktreeCwd };
      });
    },
  }));

  return (
    <NavigationStateContext.Provider
      value={{ pendingActivateChannel, pendingOpenWorktree, selectedWorktreeCwd }}
    >
      <NavigationActionsContext.Provider value={actions}>
        {children}
      </NavigationActionsContext.Provider>
    </NavigationStateContext.Provider>
  );
}
