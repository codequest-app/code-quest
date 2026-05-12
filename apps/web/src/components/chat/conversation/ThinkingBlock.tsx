import * as Collapsible from '@radix-ui/react-collapsible';
import { MarkdownContent } from '../renderers/MarkdownContent.tsx';
import { RotatableChevron } from '../renderers/primitives.tsx';

interface ThinkingBlockProps {
  content: string;
  budgetTokens?: number;
  /** Duration in milliseconds (null = still thinking) */
  durationMs?: number | null;
  /** Whether the thinking block is currently streaming */
  isStreaming?: boolean;
}

function thinkingLabel(
  isStreaming: boolean,
  durationMs?: number | null,
  budgetTokens?: number,
): string {
  if (isStreaming) return 'Thinking...';
  if (durationMs != null) return `Thought for ${Math.round(durationMs / 1000)}s`;
  if (budgetTokens != null) return `Thinking (${budgetTokens.toLocaleString()} tokens)`;
  return 'Thinking';
}

export function ThinkingBlock({
  content,
  budgetTokens,
  durationMs,
  isStreaming = false,
}: ThinkingBlockProps): React.ReactNode {
  if (!content.trim()) return null;

  const label = thinkingLabel(isStreaming, durationMs, budgetTokens);

  return (
    <Collapsible.Root className="text-sm">
      <Collapsible.Trigger className="group flex items-center gap-2 cursor-pointer select-none text-text-muted hover:text-text transition-colors">
        <span>{label}</span>
        <RotatableChevron className="opacity-40 shrink-0 group-data-[state=open]:rotate-90 group-data-[state=open]:opacity-50" />
      </Collapsible.Trigger>
      <Collapsible.Content className="mt-2 pl-3 border-l-2 border-border/50 text-sm text-text-muted/60">
        <MarkdownContent content={content} />
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
