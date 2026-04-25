import { useContext } from 'react';
import { useActiveChatTabCwdState } from '../contexts/ActiveChatTabCwdContext';
import { NavigationStateContext } from '../contexts/NavigationContext';
import { ProjectStateContext } from '../contexts/ProjectContext';

/**
 * The cwd the right-pane (and any "what folder am I looking at?" consumer)
 * should key off. Falls back through the scope hierarchy:
 *   1. active chat tab's cwd, published cross-boundary via ActiveChatTabCwdContext
 *      (the bridge from the active project's TabContainer to consumers
 *      outside any TabProvider, e.g. RightPaneWithCwd)
 *   2. sidebar-selected worktree under active project (browse scope —
 *      user clicked a worktree in the sidebar but hasn't opened a chat in it)
 *   3. active project's cwd (global scope — project root, no worktree picked)
 *   4. null (no project selected)
 *
 * Soft-bound — returns null when rendered outside the providers so callers
 * don't have to guard.
 */
export function useActiveCwd(): string | null {
  const projectState = useContext(ProjectStateContext);
  const navState = useContext(NavigationStateContext);
  const activeTabCwdState = useActiveChatTabCwdState();

  if (activeTabCwdState?.cwd) return activeTabCwdState.cwd;

  const activeProjectCwd = projectState?.activeProjectCwd ?? null;
  if (activeProjectCwd && navState?.selectedWorktreeCwd[activeProjectCwd]) {
    return navState.selectedWorktreeCwd[activeProjectCwd] ?? null;
  }
  return activeProjectCwd;
}
