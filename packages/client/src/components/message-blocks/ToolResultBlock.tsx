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

interface ArrayContentBlock {
  type: string;
  text?: string;
  tool_name?: string;
  [key: string]: unknown;
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

  const arrayContent = meta?.arrayContent as ArrayContentBlock[] | undefined;
  const displayContent = arrayContent
    ? arrayContent
        .filter((b) => b.type !== 'tool_reference')
        .map((b) => (b.type === 'text' ? String(b.text ?? '') : ''))
        .filter(Boolean)
        .join('\n') || content
    : content;

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
