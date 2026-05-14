import { MarkdownContent } from '../renderers/MarkdownContent.tsx';
import { BlockCollapsible } from '../tool-use/BlockCollapsible';

interface ThinkingBlockProps {
  content: string;
  budgetTokens?: number;
  /** Duration in milliseconds (null = still thinking) */
  durationMs?: number | null;
  /** Whether the thinking block is currently streaming */
  isStreaming?: boolean;
  blockId: string;
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
  blockId,
}: ThinkingBlockProps): React.ReactNode {
  if (!content.trim()) return null;

  const label = thinkingLabel(isStreaming, durationMs, budgetTokens);
  return (
    <BlockCollapsible blockId={blockId} label={label}>
      <div className="pl-3 border-l-2 border-border-subtle text-sm text-subtle">
        <MarkdownContent content={content} />
      </div>
    </BlockCollapsible>
  );
}
