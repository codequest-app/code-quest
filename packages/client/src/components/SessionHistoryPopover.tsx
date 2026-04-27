import type { SessionSummary } from '@code-quest/shared';
import * as Popover from '@radix-ui/react-popover';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useNavigationActions } from '../contexts/NavigationContext';
import { useProjectActions } from '../contexts/ProjectContext';
import { useSession } from '../contexts/SessionContext';
import { SessionHistory } from './SessionHistory';

interface SessionHistoryPopoverProps {
  /** When set, list filters to this project's cwd (project surface).
   *  When omitted, lists all sessions. */
  cwd?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SessionHistoryPopover({ cwd, open, onOpenChange }: SessionHistoryPopoverProps) {
  const { listSessions, renameSession, deleteSession, resume } = useSession();
  const { setActiveProject } = useProjectActions();
  const { requestActivateChannel } = useNavigationActions();

  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    listSessions({ cwd, limit: 50, excludeLive: true })
      .then((res) => {
        if (!cancelled && res.ok) setSessions(res.data.sessions);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, cwd, listSessions]);

  async function handleSelect(selectedChannelId: string) {
    const picked = sessions.find((s) => s.channelId === selectedChannelId);
    if (!picked) return;
    onOpenChange(false);
    try {
      const { channelId: spawnedId } = await resume(picked.id);
      const targetCwd = picked.cwd ?? cwd;
      if (targetCwd) {
        setActiveProject(targetCwd);
        requestActivateChannel(targetCwd, spawnedId);
      }
    } catch (err) {
      toast.error(`Resume failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (!open) return null;

  return (
    <Popover.Content
      side="right"
      align="start"
      sideOffset={8}
      onOpenAutoFocus={(e) => e.preventDefault()}
      onFocusOutside={(e) => e.preventDefault()}
      className="w-[min(400px,calc(100vw-32px))] max-h-[min(500px,50vh)] bg-surface border border-border rounded-xl flex flex-col shadow-floating overflow-hidden z-popover"
    >
      <SessionHistory
        sessions={sessions}
        loading={loading}
        onSelect={handleSelect}
        onRename={renameSession}
        onDelete={deleteSession}
      />
    </Popover.Content>
  );
}
