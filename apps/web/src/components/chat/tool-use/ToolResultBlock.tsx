import { CheckIcon } from '@heroicons/react/24/solid';
import { CollapsibleBlock } from '../renderers/primitives.tsx';
import { ContentRenderer } from './ContentRenderer.tsx';

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
  toolId,
  name,
  is_error: _isError,
  contentBlocks,
  onDiffRespond,
}: {
  content: string;
  toolId?: string;
  name?: string;
  is_error?: boolean;
  contentBlocks?: unknown[];
  onDiffRespond?: (toolId: string, accepted: boolean) => void;
}): React.JSX.Element {
  const label = name ? `Result: ${name}` : 'Result';
  const isEditTool = name === 'Edit' || name === 'Write';
  const displayContent = extractTextFromArray(contentBlocks) ?? content;

  const canDiff = isEditTool && !!onDiffRespond && !!toolId;
  const acceptHandler = canDiff ? () => onDiffRespond?.(toolId, true) : undefined;
  const rejectHandler = canDiff ? () => onDiffRespond?.(toolId, false) : undefined;

  return (
    <CollapsibleBlock icon={<CheckIcon className="w-4 h-4 shrink-0" />} label={label}>
      <ContentRenderer
        content={displayContent}
        editable={!!acceptHandler}
        onAccept={acceptHandler}
        onReject={rejectHandler}
      />
    </CollapsibleBlock>
  );
}
