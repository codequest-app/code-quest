import { createContext, type ReactNode, useContext, useState } from 'react';
import { ProjectStateContext } from './ProjectContext';

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
   *  - TabProvider's createNewTab default cwd
   *  Selecting a worktree DOES NOT auto-open chat — user clicks `+` for that. */
  selectedWorktreeCwd: Record<string, string | null>;
  activeCwd: string | null;
}

interface NavigationActions {
  requestActivateChannel: (cwd: string, channelId: string) => void;
  clearPendingActivate: () => void;
  requestOpenWorktree: (projectCwd: string, worktreeCwd: string, forceNew?: boolean) => void;
  clearPendingOpenWorktree: () => void;
  /** Set/clear which worktree the sidebar has highlighted under the given project. */
  setSelectedWorktree: (projectCwd: string, worktreeCwd: string | null) => void;
  setActiveCwd: (cwd: string | null) => void;
}

export const NavigationStateContext: React.Context<NavigationState | null> =
  createContext<NavigationState | null>(null);
export const NavigationActionsContext: React.Context<NavigationActions | null> =
  createContext<NavigationActions | null>(null);

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

export function useActiveCwd(): string | null {
  const navState = useContext(NavigationStateContext);
  const projectState = useContext(ProjectStateContext);

  if (navState?.activeCwd) return navState.activeCwd;

  const activeProjectCwd = projectState?.activeProjectCwd ?? null;
  if (activeProjectCwd && navState?.selectedWorktreeCwd[activeProjectCwd]) {
    return navState.selectedWorktreeCwd[activeProjectCwd] ?? null;
  }
  return activeProjectCwd;
}

export function NavigationProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [pendingActivateChannel, setPendingActivateChannel] =
    useState<PendingActivateChannel | null>(null);
  const [pendingOpenWorktree, setPendingOpenWorktree] = useState<PendingOpenWorktree | null>(null);
  const [selectedWorktreeCwd, setSelectedWorktreeCwdState] = useState<
    Record<string, string | null>
  >({});
  const [activeCwd, setActiveCwd] = useState<string | null>(null);

  const [actions] = useState<NavigationActions>(() => ({
    requestActivateChannel: (cwd, channelId) => setPendingActivateChannel({ cwd, channelId }),
    clearPendingActivate: () => setPendingActivateChannel(null),
    requestOpenWorktree: (projectCwd, worktreeCwd, forceNew = false) =>
      setPendingOpenWorktree({ projectCwd, worktreeCwd, forceNew }),
    clearPendingOpenWorktree: () => setPendingOpenWorktree(null),
    setActiveCwd,
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
      value={{ pendingActivateChannel, pendingOpenWorktree, selectedWorktreeCwd, activeCwd }}
    >
      <NavigationActionsContext.Provider value={actions}>
        {children}
      </NavigationActionsContext.Provider>
    </NavigationStateContext.Provider>
  );
}
