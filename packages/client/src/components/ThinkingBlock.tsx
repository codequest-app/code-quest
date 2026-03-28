import { useState } from 'react';
import { MarkdownContent } from './MarkdownContent';

interface ThinkingBlockProps {
  content: string;
  budgetTokens?: number;
  /** Duration in milliseconds (null = still thinking) */
  durationMs?: number | null;
  /** Whether the thinking block is currently streaming */
  isStreaming?: boolean;
}

export function ThinkingBlock({
  content,
  budgetTokens,
  durationMs,
  isStreaming = false,
}: ThinkingBlockProps) {
  const [open, setOpen] = useState(false);

  if (!content.trim()) return null;

  const label = isStreaming
    ? 'Thinking...'
    : durationMs != null
      ? `Thought for ${Math.round(durationMs / 1000)}s`
      : budgetTokens != null
        ? `Thinking (${budgetTokens.toLocaleString()} tokens)`
        : 'Thinking';

  return (
    <details
      className="text-sm"
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="list-none flex items-center gap-2 cursor-pointer select-none text-text-muted py-1 hover:text-text transition-colors">
        <svg
          aria-hidden="true"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`transition-transform flex-shrink-0 ${open ? 'rotate-90' : ''}`}
        >
          <path
            d="M4 2L8 6L4 10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>{label}</span>
      </summary>
      <div className="mt-2 pl-3 border-l-2 border-border/50 text-sm text-text-muted/80">
        <MarkdownContent content={content} />
      </div>
    </details>
  );
}
