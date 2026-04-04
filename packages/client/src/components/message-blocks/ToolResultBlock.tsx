import type { ToolResultMeta } from '../../types/ui';
import { isDiff } from '../../utils/diff';
import { DiffViewer } from '../DiffViewer';
import {
  AnsiContent,
  CODE_BLOCK_CLASS,
  CollapsibleBlock,
  hasAnsi,
  parseFilePathsInContent,
} from './shared';

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
  meta?: ToolResultMeta & { arrayContent?: unknown[] };
  onDiffRespond?: (toolId: string, accepted: boolean) => void;
}) {
  const label = meta?.name ? `Result: ${meta.name}` : 'Result';
  const isEditTool = meta?.name === 'Edit' || meta?.name === 'Write';
  const toolId = meta?.toolId;
  const canRespond = isEditTool && !!onDiffRespond && !!toolId;

  const displayContent = extractTextFromArray(meta?.arrayContent) ?? content;

  return (
    <CollapsibleBlock icon="✓" label={label}>
      {isDiff(displayContent) ? (
        <DiffViewer
          content={displayContent}
          editable={canRespond}
          onAccept={canRespond ? () => onDiffRespond?.(toolId ?? '', true) : undefined}
          onReject={canRespond ? () => onDiffRespond?.(toolId ?? '', false) : undefined}
        />
      ) : hasAnsi(displayContent) ? (
        <AnsiContent content={displayContent} />
      ) : (
        <pre className={CODE_BLOCK_CLASS}>{parseFilePathsInContent(displayContent)}</pre>
      )}
    </CollapsibleBlock>
  );
}
