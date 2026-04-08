import { sessionResumePayloadSchema } from '@code-quest/shared';
import { useEffect, useMemo, useRef } from 'react';
import { useProjectState } from '../contexts/ProjectContext';
import { useSocket } from '../contexts/SocketContext';
import { useTabActions } from '../contexts/TabContext';

/**
 * Bridges ProjectProvider's sessions to TabContext.
 * Incrementally adds/removes tabs as sessions change.
 * When cwd is provided, only syncs sessions matching that cwd (per-project mode).
 * Must be rendered inside SocketProvider, ProjectProvider, and TabProvider.
 */
export function useSessionSync(cwd?: string) {
  const { socket } = useSocket();
  const { sessions: allSessions } = useProjectState();
  const { addTab, removeTab, replaceActiveTab } = useTabActions();
  const prevSessionIds = useRef<Set<string>>(new Set());

  const sessions = useMemo(
    () => (cwd ? allSessions.filter((s) => s.cwd === cwd) : allSessions),
    [allSessions, cwd],
  );

  // Incrementally sync tabs when sessions change
  // biome-ignore lint/correctness/useExhaustiveDependencies: addTab/removeTab use setState updater — React Compiler stabilises references
  useEffect(() => {
    const currentIds = new Set(sessions.map((s) => s.channelId));

    // Add tabs for new sessions
    for (const s of sessions) {
      if (!prevSessionIds.current.has(s.channelId)) {
        addTab(s.channelId, s.cwd);
      }
    }

    // Remove tabs for dead sessions
    for (const id of prevSessionIds.current) {
      if (!currentIds.has(id)) {
        removeTab(id);
      }
    }

    prevSessionIds.current = currentIds;
  }, [sessions]);

  // Handle session:resume → replaceActiveTab
  // biome-ignore lint/correctness/useExhaustiveDependencies: replaceActiveTab uses setState updater — React Compiler stabilises references
  useEffect(() => {
    const onResume = (raw: unknown) => {
      const parsed = sessionResumePayloadSchema.safeParse(raw);
      if (!parsed.success) return;
      replaceActiveTab(parsed.data.channelId);
    };

    socket.on('session:resume', onResume);
    return () => {
      socket.off('session:resume', onResume);
    };
  }, [socket]);
}
