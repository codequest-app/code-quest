import { useState } from 'react';
import { ChevronRight } from '@/components/ui/Icons';
import { cn } from '@/utils/cn';
import { MarkdownContent } from '../renderers/MarkdownContent';

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
}: ThinkingBlockProps): React.ReactNode {
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
        <ChevronRight
          className={cn('w-4 h-4 shrink-0 transition-transform', open && 'rotate-90')}
        />
        <span>{label}</span>
      </summary>
      <div className="mt-2 pl-3 border-l-2 border-border/50 text-sm text-text-muted/60">
        <MarkdownContent content={content} />
      </div>
    </details>
  );
}
