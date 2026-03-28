import type { DiffEntry } from '../utils/diff';
import { generateUnifiedDiff } from '../utils/diff';
import { DiffViewer } from './DiffViewer';
import { MarkdownContent } from './MarkdownContent';

interface ContentPreviewPanelProps {
  content: string;
  title?: string;
  diffs?: DiffEntry[];
  onClose: () => void;
  /** toolId of a pending diff review — shows Accept/Reject buttons when set */
  pendingDiffToolId?: string;
  onDiffRespond?: (toolId: string, accepted: boolean) => void;
}

export function ContentPreviewPanel({
  content,
  title,
  diffs,
  onClose,
  pendingDiffToolId,
  onDiffRespond,
}: ContentPreviewPanelProps) {
  return (
    <div className="flex flex-col h-full bg-surface border-r border-border">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-medium text-text">{title ?? 'Preview'}</span>
        <button
          type="button"
          title="Close"
          aria-label="Close"
          onClick={onClose}
          className="text-text-muted hover:text-text text-sm"
        >
          ✕
        </button>
      </div>
      {pendingDiffToolId && onDiffRespond && (
        <div className="flex gap-2 px-4 py-2 border-b border-border">
          <button
            type="button"
            onClick={() => onDiffRespond(pendingDiffToolId, true)}
            className="px-3 py-1 text-xs bg-success text-white rounded hover:opacity-80 transition-opacity"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() => onDiffRespond(pendingDiffToolId, false)}
            className="px-3 py-1 text-xs bg-danger text-white rounded hover:opacity-80 transition-opacity"
          >
            Reject
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {diffs?.length ? (
          <div className="space-y-4">
            {diffs.map((d) => (
              <DiffViewer
                key={d.filePath}
                content={generateUnifiedDiff(d.oldContent, d.newContent, d.filePath)}
              />
            ))}
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <MarkdownContent content={content} />
          </div>
        )}
      </div>
    </div>
  );
}
