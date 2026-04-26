import type { Ack, SessionSummary } from '@code-quest/shared';
import { ClockIcon } from '@heroicons/react/24/outline';
import * as Popover from '@radix-ui/react-popover';
import { HDR_BTN } from './HeaderBar';
import { SessionHistory } from './SessionHistory';

interface SessionHistoryPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessions: SessionSummary[];
  loading?: boolean;
  onSelect: (id: string) => void;
  onRename?: (id: string, title: string) => Promise<Ack>;
  onDelete?: (id: string) => Promise<Ack>;
}

export function SessionHistoryPopover({
  open,
  onOpenChange,
  sessions,
  loading,
  onSelect,
  onRename,
  onDelete,
}: SessionHistoryPopoverProps) {
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger title="Session history" aria-label="Session history" className={HDR_BTN}>
        <ClockIcon className="w-4 h-4" aria-hidden="true" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          role="dialog"
          aria-label="Session list"
          data-testid="session-history-popover"
          align="end"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="z-popover w-100 max-h-[50vh] bg-surface border border-border rounded-xl flex flex-col shadow-floating overflow-hidden"
        >
          <SessionHistory
            sessions={sessions}
            loading={loading}
            onSelect={onSelect}
            onRename={onRename}
            onDelete={onDelete}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
