import { useState } from 'react';
import type { FileSnapshot } from '../types/chat';
import { cn } from '../utils/cn';
import { generateUnifiedDiff } from '../utils/diff';
import { pluralize } from '../utils/pluralize';
import { DiffViewer } from './DiffViewer';

export interface ModifiedFile {
  path: string;
  status: string;
  oldContent?: string;
  newContent?: string;
}

interface ModifiedFilesPanelProps {
  files: ModifiedFile[];
  fileSnapshots?: FileSnapshot[];
  onAccept: (path: string) => void;
  onRewind?: (path: string) => void;
}

const statusColor: Record<string, string> = {
  added: 'bg-success',
  modified: 'bg-warning',
  deleted: 'bg-danger',
};

function ModifiedFileItem({
  file,
  versionCount,
  isOpen,
  onToggle,
  onAccept,
  onRewind,
}: {
  file: ModifiedFile;
  versionCount: number;
  isOpen: boolean;
  onToggle: () => void;
  onAccept: (path: string) => void;
  onRewind?: (path: string) => void;
}) {
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 w-full text-left py-1 px-1 hover:bg-bg-secondary rounded text-sm font-mono"
      >
        <span
          data-testid={`status-${file.path}`}
          className={cn(
            'inline-block w-2 h-2 rounded-full',
            statusColor[file.status] ?? 'bg-text-muted',
          )}
        />
        {file.path}
        {versionCount > 1 && (
          <span className="ml-auto text-xs text-text-muted bg-bg-secondary rounded px-1.5 py-0.5">
            {versionCount} versions
          </span>
        )}
      </button>
      {isOpen && (
        <div className="pl-4 pb-2">
          {file.oldContent && file.newContent ? (
            <DiffViewer
              content={generateUnifiedDiff(file.oldContent, file.newContent, file.path)}
            />
          ) : (
            <pre className="text-xs bg-bg-secondary rounded p-2 overflow-auto max-h-60">
              {file.oldContent && <div className="text-danger">- {file.oldContent}</div>}
              {file.newContent && <div className="text-success">+ {file.newContent}</div>}
            </pre>
          )}
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={() => onAccept(file.path)}
              className="text-xs px-2 py-0.5 rounded bg-success text-white hover:bg-success/80"
            >
              Accept
            </button>
            {onRewind && (
              <button
                type="button"
                onClick={() => onRewind(file.path)}
                className="text-xs px-2 py-0.5 rounded bg-warning text-white hover:bg-warning/80"
              >
                Rewind
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function ModifiedFilesPanel({
  files,
  fileSnapshots = [],
  onAccept,
  onRewind,
}: ModifiedFilesPanelProps) {
  const [expandedFile, setExpandedFile] = useState<string | null>(null);

  if (files.length === 0) return null;

  return (
    <div className="border border-border rounded p-2 space-y-1" data-testid="modified-files-panel">
      <div className="text-sm font-semibold text-text-muted mb-1">
        {pluralize(files.length, 'file')} modified
      </div>
      {files.map((file) => (
        <ModifiedFileItem
          key={file.path}
          file={file}
          versionCount={fileSnapshots.filter((s) => s.filePath === file.path).length}
          isOpen={expandedFile === file.path}
          onToggle={() => setExpandedFile(expandedFile === file.path ? null : file.path)}
          onAccept={onAccept}
          onRewind={onRewind}
        />
      ))}
    </div>
  );
}
