import type { SessionSummary } from '@code-quest/shared';
import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useNavigationActions } from '../contexts/NavigationContext';
import { useProjectActions } from '../contexts/ProjectContext';
import { useSession } from '../contexts/SessionContext';
import { cn } from '../utils/cn';
import { SessionHistory } from './SessionHistory';

interface ResumeSessionsDropdownProps {
  /** When set, list filters to this project's cwd (project surface).
   *  When omitted, lists all sessions. */
  cwd?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResumeSessionsDropdown({ cwd, open, onOpenChange }: ResumeSessionsDropdownProps) {
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

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-popover bg-black/40" />
        <Dialog.Content
          aria-label="Session list"
          data-testid="session-history-dialog"
          onOpenAutoFocus={(e) => e.preventDefault()}
          className={cn(
            'fixed z-popover top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-[calc(100vw-2rem)] max-w-100 lg:max-w-lg',
            'max-h-[calc(100dvh-4rem)]',
            'bg-surface border border-border rounded-xl',
            'flex flex-col shadow-floating overflow-hidden',
          )}
        >
          <SessionHistory
            sessions={sessions}
            loading={loading}
            onSelect={handleSelect}
            onRename={renameSession}
            onDelete={deleteSession}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
