import type { ToolResultMeta } from '@/types/ui';
import { ContentRenderer } from './ContentRenderer.tsx';
import { CollapsibleBlock } from './primitives.tsx';

function extractTextFromArray(arr: unknown): string | null {
  if (!Array.isArray(arr)) return null;
  const texts = arr
    .filter((b): b is Record<string, unknown> => typeof b === 'object' && b !== null)
    .filter((b) => b.type !== 'tool_reference')
    .map((b) => (b.type === 'text' ? String(b.text ?? '') : ''))
    .filter(Boolean);
  return texts.length > 0 ? texts.join('\n') : null;
}

export function ToolResultBlock({
  content,
  meta,
  onDiffRespond,
}: {
  content: string;
  meta?: ToolResultMeta;
  onDiffRespond?: (toolId: string, accepted: boolean) => void;
}): React.JSX.Element {
  const label = meta?.name ? `Result: ${meta.name}` : 'Result';
  const isEditTool = meta?.name === 'Edit' || meta?.name === 'Write';
  const toolId = meta?.toolId;
  const displayContent = extractTextFromArray(meta?.arrayContent) ?? content;

  const acceptHandler =
    isEditTool && onDiffRespond && toolId ? () => onDiffRespond(toolId, true) : undefined;
  const rejectHandler =
    isEditTool && onDiffRespond && toolId ? () => onDiffRespond(toolId, false) : undefined;

  return (
    <CollapsibleBlock icon="✓" label={label}>
      <ContentRenderer
        content={displayContent}
        editable={!!acceptHandler}
        onAccept={acceptHandler}
        onReject={rejectHandler}
      />
    </CollapsibleBlock>
  );
}
