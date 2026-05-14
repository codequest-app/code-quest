import { DiffViewer } from '@/components/chat/renderers/DiffViewer';
import { cn } from '@/utils/cn';
import { isDiff } from '@/utils/diff';
import {
  AnsiContent,
  CODE_BLOCK_CLASS,
  hasAnsi,
  renderFilePathsWithCopyButtons,
} from '../renderers/primitives.tsx';

interface ContentRendererProps {
  content: string;
  isError?: boolean;
  bare?: boolean;
  editable?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
}

export function ContentRenderer({
  content,
  isError,
  bare,
  editable,
  onAccept,
  onReject,
}: ContentRendererProps): React.JSX.Element {
  if (isDiff(content)) {
    return (
      <DiffViewer content={content} editable={!!editable} onAccept={onAccept} onReject={onReject} />
    );
  }
  if (hasAnsi(content)) {
    return <AnsiContent content={content} bare={bare} />;
  }
  return (
    <pre
      role={isError ? 'alert' : undefined}
      className={cn(
        !bare && CODE_BLOCK_CLASS,
        isError && 'text-danger',
        bare && 'whitespace-pre-wrap font-mono text-xs',
      )}
    >
      {renderFilePathsWithCopyButtons(content)}
    </pre>
  );
}
