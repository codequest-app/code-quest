import { isDiff } from '../../../../utils/diff';
import { DiffViewer } from '../../renderers/DiffViewer';
import { AnsiContent, CODE_BLOCK_CLASS, hasAnsi, parseFilePathsInContent } from './primitives';

interface ContentRendererProps {
  content: string;
  editable?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
}

export function ContentRenderer({
  content,
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
    return <AnsiContent content={content} />;
  }
  return <pre className={CODE_BLOCK_CLASS}>{parseFilePathsInContent(content)}</pre>;
}
