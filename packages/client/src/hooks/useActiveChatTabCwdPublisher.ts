import { useEffect } from 'react';
import { useActiveChatTabCwdActions } from '../contexts/ActiveChatTabCwdContext';
import { useProjectState } from '../contexts/ProjectContext';
import { useTabState } from '../contexts/TabContext';

/** Inside each project's TabContainer, publish the project's active-tab
 *  cwd to ActiveChatTabCwdContext when (and only when) this project is the
 *  globally-active project. The active project's TabContainer effectively
 *  owns the slot; inactive projects' publishers no-op so they don't race
 *  the active writer.
 *
 *  Reads ONLY the actions context (stable identity) — TabContainer does
 *  NOT re-render when cwd changes; the actual cwd-state-driven re-render
 *  lands at the reader (RightPaneWithCwd → useActiveCwd). */
export function useActiveChatTabCwdPublisher(projectCwd: string): void {
  const actions = useActiveChatTabCwdActions();
  const { activeProjectCwd } = useProjectState();
  const { activeTabId, tabs } = useTabState();

  const isThisActive = projectCwd === activeProjectCwd;
  const activeTabCwd = activeTabId ? (tabs[activeTabId]?.cwd ?? null) : null;

  // Cleanup is intentionally NOT in this effect — a single effect with
  // [activeTabCwd] in the cleanup deps would fire on every cwd change,
  // causing a transient null → newCwd flap visible to subscribers.
  useEffect(() => {
    if (!actions) return;
    if (!isThisActive) return;
    actions.setCwd(activeTabCwd);
  }, [actions, isThisActive, activeTabCwd]);

  // Cleanup on active→inactive (or unmount): the last-published cwd would
  // otherwise linger forever when no other project takes over.
  useEffect(() => {
    if (!actions) return;
    if (!isThisActive) return;
    return () => {
      actions.setCwd(null);
    };
  }, [actions, isThisActive]);
}
