import type React from 'react';
import { useState } from 'react';
import { cn } from '../utils/cn';
import { extractNewContent, parseDiffFileName, parseHunkStart } from '../utils/diff';

interface DiffViewerProps {
  content: string;
  editable?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onAcceptEdited?: (editedContent: string) => void;
}

function AcceptRejectButtons({
  onAccept,
  onReject,
  onEdit,
}: {
  onAccept?: () => void;
  onReject?: () => void;
  onEdit?: () => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onAccept}
        className="text-xs text-success hover:text-success/80 font-medium"
      >
        ✓ Accept
      </button>
      <button
        type="button"
        onClick={onReject}
        className="text-xs text-danger hover:text-danger/80 font-medium"
      >
        ✗ Reject
      </button>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="text-xs text-accent hover:text-accent/80 font-medium"
        >
          ✎ Edit
        </button>
      )}
    </div>
  );
}

interface AnnotatedLine {
  cls: string;
  gutter: string;
  text: string;
}

function annotateLines(lines: string[]): AnnotatedLine[] {
  const PAD = 4;
  let oldLine = 0;
  let newLine = 0;
  return lines.map((line) => {
    if (line.startsWith('@@')) {
      const hunk = parseHunkStart(line);
      if (hunk) {
        oldLine = hunk.oldStart;
        newLine = hunk.newStart;
      }
      return { cls: 'text-accent', gutter: '  ', text: line };
    }
    if (line.startsWith('---') || line.startsWith('+++')) {
      return { cls: 'text-text-muted', gutter: '  ', text: line };
    }
    if (line.startsWith('+')) {
      const gutter = String(newLine++).padStart(PAD);
      return { cls: 'text-success', gutter, text: line };
    }
    if (line.startsWith('-')) {
      const gutter = String(oldLine++).padStart(PAD);
      return { cls: 'text-danger', gutter, text: line };
    }
    const gutter = oldLine > 0 ? String(newLine++).padStart(PAD) : '';
    if (oldLine > 0) oldLine++;
    return { cls: '', gutter, text: line };
  });
}

function DiffFileHeader({
  fileName,
  actions,
  lines,
}: {
  fileName: string;
  actions?: React.ReactNode;
  lines?: string[];
}) {
  const insertions = lines ? lines.filter((l) => l.startsWith('+')).length : 0;
  const deletions = lines ? lines.filter((l) => l.startsWith('-')).length : 0;
  return (
    <section
      className="flex items-center justify-between bg-surface-hover px-3 py-1.5 rounded-t-lg border border-border border-b-0"
      aria-label="diff-filename"
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-text-muted">{fileName}</span>
        {lines && (
          <span className="flex items-center gap-1">
            <span className="text-success font-mono text-xs">+{insertions}</span>
            <span className="text-danger font-mono text-xs">-{deletions}</span>
          </span>
        )}
      </div>
      {actions}
    </section>
  );
}

export function DiffViewer({
  content,
  editable,
  onAccept,
  onReject,
  onAcceptEdited,
}: DiffViewerProps): React.JSX.Element {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const fileName = parseDiffFileName(content);
  const annotated = annotateLines(content.split('\n'));

  const handleEdit = () => {
    setEditedContent(extractNewContent(content));
    setIsEditing(true);
  };

  const handleApplyEdit = () => {
    onAcceptEdited?.(editedContent);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div>
        {fileName && <DiffFileHeader fileName={fileName} lines={content.split('\n')} />}
        <textarea
          className="w-full bg-code-block p-3 text-xs font-mono border border-border rounded-b-lg"
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          aria-label="diff-edit-textarea"
          rows={10}
        />
        <div className="flex gap-2 mt-1">
          <button
            type="button"
            onClick={handleApplyEdit}
            className="text-xs text-success hover:text-success/80 font-medium"
          >
            Apply Edit
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-xs text-text-muted hover:text-text-muted/60 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {fileName ? (
        <DiffFileHeader
          fileName={fileName}
          lines={content.split('\n')}
          actions={
            editable ? (
              <AcceptRejectButtons
                onAccept={onAccept}
                onReject={onReject}
                onEdit={onAcceptEdited ? handleEdit : undefined}
              />
            ) : undefined
          }
        />
      ) : (
        editable && (
          <div className="flex gap-2 mb-1">
            <AcceptRejectButtons
              onAccept={onAccept}
              onReject={onReject}
              onEdit={onAcceptEdited ? handleEdit : undefined}
            />
          </div>
        )
      )}
      <pre
        className={cn(
          'bg-code-block p-3 overflow-x-auto text-xs font-mono border border-border',
          fileName ? 'rounded-b-lg' : 'rounded-lg',
        )}
      >
        {annotated.map(({ cls, gutter, text }, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: diff lines render once, never reorder
          <div key={`${i}-${gutter ?? ''}`} className={cls}>
            {gutter && <span className="text-text-muted/40 select-none mr-2">{gutter}</span>}
            {text}
          </div>
        ))}
      </pre>
    </div>
  );
}
