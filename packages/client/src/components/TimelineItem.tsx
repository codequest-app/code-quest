import { useState } from 'react';
import { CopyButton } from './message-blocks/CopyButton';

type TimelineStatus = 'success' | 'error' | 'warning' | 'in-progress';

const statusStyles: Record<TimelineStatus, { dot: string; cls: string }> = {
  success: { dot: '●', cls: 'text-success' },
  error: { dot: '●', cls: 'text-danger' },
  warning: { dot: '●', cls: 'text-warning' },
  'in-progress': { dot: '○', cls: 'text-accent animate-pulse' },
};

interface TimelineItemProps {
  toolName: string;
  description: string;
  status?: TimelineStatus;
  input: string;
  output: string;
}

export function TimelineItem({ toolName, description, status, input, output }: TimelineItemProps) {
  const [expanded, setExpanded] = useState(false);

  const resolvedStatus: TimelineStatus = status ?? 'in-progress';
  const { dot, cls } = statusStyles[resolvedStatus];

  return (
    <div className="text-xs">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 w-full text-left text-text-muted hover:text-text transition-colors py-0.5"
      >
        <span className={cls}>{dot}</span>
        <span className="font-medium">{toolName}</span>
        <span className="text-text-muted/70 truncate">{description}</span>
      </button>
      {expanded && (
        <div className="ml-5 mt-1 mb-2 space-y-1">
          {input && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-text-muted/50 uppercase font-medium">IN</span>
                <CopyButton
                  text={input}
                  title="Copy input"
                  className="p-0.5 rounded text-text-muted/50 hover:text-text-muted hover:bg-white/5 transition-colors"
                />
              </div>
              <pre className="text-[11px] text-text-muted/60 bg-surface-hover rounded px-2 py-1 overflow-x-auto whitespace-pre-wrap">
                {input}
              </pre>
            </>
          )}
          {output && (
            <>
              <span className="text-[10px] text-text-muted/50 uppercase font-medium">OUT</span>
              <pre className="text-[11px] text-text-muted/80 bg-surface-hover rounded px-2 py-1 overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">
                {output}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}
