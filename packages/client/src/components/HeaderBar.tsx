import type { SessionStatus } from '../types/ui';

interface HeaderBarProps {
  status: SessionStatus;
  sessionId: string | null;
}

const statusConfig: Record<SessionStatus, { label: string; dotClass: string }> = {
  disconnected: { label: 'Disconnected', dotClass: 'bg-danger' },
  idle: { label: 'Connected', dotClass: 'bg-success' },
  processing: { label: 'Processing', dotClass: 'bg-accent animate-pulse' },
};

export function HeaderBar({ status, sessionId }: HeaderBarProps) {
  const { label, dotClass } = statusConfig[status];

  return (
    <header className="flex items-center gap-3 px-4 h-10 bg-surface border-b border-border text-sm">
      <span className={`w-2 h-2 rounded-full ${dotClass}`} />
      <span className="text-text-muted">{label}</span>
      {sessionId && (
        <span className="ml-auto text-text-muted font-mono text-xs truncate">{sessionId}</span>
      )}
    </header>
  );
}
