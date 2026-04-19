import type { DiffEntry } from '../utils/diff';
import { generateUnifiedDiff } from '../utils/diff';
import { DiffViewer } from './DiffViewer';
import { MarkdownContent } from './MarkdownContent';
import { Button } from './ui/Button';
import { Dialog, DialogContent } from './ui/Dialog';

interface ContentPreviewDialogProps {
  content: string;
  title?: string;
  diffs?: DiffEntry[];
  onClose: () => void;
  /** toolId of a pending diff review — shows Accept/Reject buttons when set */
  pendingDiffToolId?: string;
  onDiffRespond?: (toolId: string, accepted: boolean) => void;
}

export function ContentPreviewDialog({
  content,
  title,
  diffs,
  onClose,
  pendingDiffToolId,
  onDiffRespond,
}: ContentPreviewDialogProps) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        title="Content preview"
        hideTitle
        className="w-[calc(100vw-40px)] max-w-350 h-[calc(100vh-40px)] max-h-225 p-0 flex flex-col bg-bg"
      >
        <div className="flex items-center gap-3 px-3 py-2 border-b border-border bg-surface">
          <span className="text-sm font-semibold text-text truncate flex-1 min-w-0">
            {title ?? 'Preview'}
          </span>
          {pendingDiffToolId && onDiffRespond && (
            <div className="flex gap-2">
              <Button
                variant="primary"
                className="bg-success hover:bg-success/80"
                onClick={() => onDiffRespond(pendingDiffToolId, true)}
              >
                Accept
              </Button>
              <Button variant="danger" onClick={() => onDiffRespond(pendingDiffToolId, false)}>
                Reject
              </Button>
            </div>
          )}
          <Button variant="ghost" aria-label="Close" title="Close" onClick={onClose}>
            ✕
          </Button>
        </div>

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
            <div className="prose prose-themed prose-sm max-w-none">
              <MarkdownContent content={content} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
