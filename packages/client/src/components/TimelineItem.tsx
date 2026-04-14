import { useState } from 'react';

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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? 'Copied!' : 'Copy input'}
      className="p-0.5 rounded text-text-muted/50 hover:text-text-muted hover:bg-white/5 transition-colors"
    >
      {copied ? (
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path
            d="M3 8L6.5 11.5L13 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none">
          <rect x="5" y="5" width="8" height="9" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <path
            d="M5 4V3C5 2.44772 5.44772 2 6 2H13C13.5523 2 14 2.44772 14 3V11C14 11.5523 13.5523 12 13 12H12"
            stroke="currentColor"
            strokeWidth="1.2"
          />
        </svg>
      )}
    </button>
  );
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
                <CopyButton text={input} />
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
