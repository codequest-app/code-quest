import type { SessionStatus } from '../types/ui';

interface HeaderBarProps {
  status: SessionStatus;
  sessionId: string | null;
  model?: string | null;
  tools?: string[];
  statusText?: string | null;
}

const statusConfig: Record<SessionStatus, { label: string; dotClass: string }> = {
  disconnected: { label: 'Disconnected', dotClass: 'bg-danger glow-danger' },
  idle: { label: 'Connected', dotClass: 'bg-success glow-success' },
  processing: { label: 'Processing', dotClass: 'bg-accent glow-accent animate-pulse' },
};

export function HeaderBar({ status, sessionId, model, tools, statusText }: HeaderBarProps) {
  const { label, dotClass } = statusConfig[status];

  return (
    <header className="flex items-center gap-3 px-6 h-11 bg-surface border-b border-border text-xs shrink-0">
      <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
      <span className="text-text-muted font-medium">{label}</span>
      {model && <span className="text-text-muted/60 font-mono text-[11px]">{model}</span>}
      {statusText && <span className="text-accent text-[11px] italic">{statusText}</span>}
      {tools && tools.length > 0 && (
        <span className="text-text-muted/60 text-[11px]">{tools.length} tools</span>
      )}
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
