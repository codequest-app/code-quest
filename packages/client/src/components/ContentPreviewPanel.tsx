import { useEffect } from 'react';
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
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  }, [onClose]);

  return (
    <div
      data-testid="modal-backdrop"
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="none"
    >
      <div className="bg-bg border border-border rounded flex flex-col w-[calc(100vw-40px)] max-w-[1400px] h-[calc(100vh-40px)] max-h-[900px] shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-3 py-2 border-b border-border bg-surface">
          <span className="text-sm font-semibold text-text truncate flex-1 min-w-0">
            {title ?? 'Preview'}
          </span>
          {pendingDiffToolId && onDiffRespond && (
            <div className="flex gap-2">
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
          <button
            type="button"
            title="Close"
            aria-label="Close"
            onClick={onClose}
            className="text-text-muted hover:text-text text-sm flex-shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Content */}
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
    </div>
  );
}
