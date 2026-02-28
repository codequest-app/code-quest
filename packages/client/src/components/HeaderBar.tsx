import type { SessionStatus } from '../types/ui';

interface HeaderBarProps {
  status: SessionStatus;
  sessionId: string | null;
}

const statusConfig: Record<SessionStatus, { label: string; dotClass: string }> = {
  disconnected: { label: 'Disconnected', dotClass: 'bg-danger glow-danger' },
  idle: { label: 'Connected', dotClass: 'bg-success glow-success' },
  processing: { label: 'Processing', dotClass: 'bg-accent glow-accent animate-pulse' },
};

export function HeaderBar({ status, sessionId }: HeaderBarProps) {
  const { label, dotClass } = statusConfig[status];

  return (
    <header className="flex items-center gap-3 px-6 h-11 bg-surface border-b border-border text-xs shrink-0">
      <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
      <span className="text-text-muted font-medium">{label}</span>
      {sessionId && (
        <>
          <div className="flex-1" />
          <span className="text-text-muted/40 font-mono text-[11px] truncate max-w-[240px]">
            {sessionId}
          </span>
        </>
      )}
    </header>
  );
}
