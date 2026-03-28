import { isDiff } from '../../utils/diff';
import { DiffViewer } from '../DiffViewer';
import {
  AnsiContent,
  CODE_BLOCK_CLASS,
  CollapsibleBlock,
  hasAnsi,
  parseFilePathsInContent,
} from './shared';

export function ToolResultBlock({
  content,
  meta,
  onDiffRespond,
}: {
  content: string;
  meta?: Record<string, unknown>;
  onDiffRespond?: (toolId: string, accepted: boolean) => void;
}) {
  const label = meta?.name ? `Result: ${meta.name}` : 'Result';
  const isEditTool = meta?.name === 'Edit' || meta?.name === 'Write';
  const toolId = meta?.toolId as string | undefined;
  const canRespond = isEditTool && !!onDiffRespond && !!toolId;
  return (
    <CollapsibleBlock icon="✓" label={label}>
      {isDiff(content) ? (
        <DiffViewer
          content={content}
          editable={canRespond}
          onAccept={canRespond ? () => onDiffRespond?.(toolId ?? '', true) : undefined}
          onReject={canRespond ? () => onDiffRespond?.(toolId ?? '', false) : undefined}
        />
      ) : hasAnsi(content) ? (
        <AnsiContent content={content} />
      ) : (
        <pre className={CODE_BLOCK_CLASS}>{parseFilePathsInContent(content)}</pre>
      )}
    </CollapsibleBlock>
  );
}
