import { useEffect, useMemo, useRef } from 'react';
import { useProjectState } from '../contexts/ProjectContext';
import { useTabActions } from '../contexts/TabContext';

/**
 * Bridges ProjectProvider's sessions to TabContext.
 * Incrementally adds/removes tabs as sessions change.
 * Detects resume pattern (1 removed + 1 added, same count) and uses replaceActiveTab.
 * When cwd is provided, only syncs sessions matching that cwd (per-project mode).
 * Must be rendered inside ProjectProvider and TabProvider.
 */
export function SessionTabSync({ cwd }: { cwd?: string }) {
  const { sessions: allSessions } = useProjectState();
  const { addTab, removeTab, replaceActiveTab } = useTabActions();
  const prevSessionIds = useRef<Set<string>>(new Set());

  const sessions = useMemo(
    () => (cwd ? allSessions.filter((s) => s.cwd === cwd) : allSessions),
    [allSessions, cwd],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: addTab/removeTab/replaceActiveTab use setState updater — React Compiler stabilises references
  useEffect(() => {
    const currentIds = new Set(sessions.map((s) => s.channelId));
    const added = sessions.filter((s) => !prevSessionIds.current.has(s.channelId));
    const removed = [...prevSessionIds.current].filter((id) => !currentIds.has(id));

    // Resume pattern: exactly 1 added + 1 removed, total count unchanged
    if (added.length === 1 && removed.length === 1) {
      replaceActiveTab(added[0].channelId);
    } else {
      for (const s of added) {
        addTab(s.channelId, s.cwd);
      }
      for (const id of removed) {
        removeTab(id);
      }
    }

    prevSessionIds.current = currentIds;
  }, [sessions]);

  return null;
}
