import type { SessionSummary } from '@code-quest/shared';
import * as Popover from '@radix-ui/react-popover';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';
import { SessionHistory } from './SessionHistory.tsx';

interface SessionHistoryPopoverProps {
  cwd?: string;
  onClose: () => void;
  onResumed: (spawnedId: string, picked: SessionSummary) => void;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
}

export function SessionHistoryPopover({
  cwd,
  onClose,
  onResumed,
  side = 'right',
  align = 'start',
}: SessionHistoryPopoverProps): React.JSX.Element {
  const { listSessions, renameSession, deleteSession, resume } = useSession();

  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSessions = useCallback(() => {
    setLoading(true);
    return listSessions({ cwd, limit: 50 })
      .then((res) => {
        if (res.ok) setSessions(res.data.sessions);
      })
      .finally(() => setLoading(false));
  }, [cwd, listSessions]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  async function handleSelect(selectedChannelId: string) {
    const picked = sessions.find((s) => s.channelId === selectedChannelId);
    if (!picked) return;
    onClose();
    try {
      const { channelId: spawnedId } = await resume(picked.id);
      onResumed(spawnedId, picked);
    } catch (err) {
      toast.error(`Resume failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteSession(id);
    if (result.ok) void fetchSessions();
    return result;
  }

  return (
    <Popover.Content
      side={side}
      align={align}
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
        onDelete={handleDelete}
      />
    </Popover.Content>
  );
}
