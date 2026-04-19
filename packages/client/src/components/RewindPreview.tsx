import { type FileDiff, fileDiffSchema, type RewindResult } from '@code-quest/shared';
import { useState } from 'react';
import { z } from 'zod';
import { JsonViewer } from './JsonViewer';

const fileDiffMapSchema = z.record(z.string(), fileDiffSchema);

interface RewindPreviewProps {
  data: RewindResult | Record<string, unknown>;
}

function diffType(diff: FileDiff): 'added' | 'deleted' | 'modified' {
  if (diff.oldContent === null) return 'added';
  if (diff.newContent === null) return 'deleted';
  return 'modified';
}

const badgeClass: Record<string, string> = {
  modified: 'text-warning',
  deleted: 'text-danger',
  added: 'text-success',
};

const CODE_PRE =
  'bg-code-block p-2 rounded border border-border overflow-auto max-h-40 whitespace-pre-wrap';

export function RewindPreview({ data }: RewindPreviewProps) {
  const parsed = fileDiffMapSchema.safeParse(data.fileDiffs);
  const entries = parsed.success ? Object.entries(parsed.data) : [];

  if (entries.length > 0) {
    return (
      <div className="flex flex-col gap-1">
        {entries.map(([path, diff]) => (
          <FileDiffEntry key={path} path={path} diff={diff} />
        ))}
      </div>
    );
  }

  return (
    <JsonViewer
      data={data}
      className="bg-code-block p-3 rounded-lg overflow-auto text-xs border border-border max-h-60"
    />
  );
}

function FileDiffEntry({ path, diff }: { path: string; diff: FileDiff }) {
  const [open, setOpen] = useState(false);
  const type = diffType(diff);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-xs font-mono w-full text-left hover:bg-white/5 rounded px-1"
      >
        <span className={badgeClass[type]}>{type}</span>
        <span className="text-text">{path}</span>
      </button>
      {open && (
        <div className="ml-4 mt-1 text-xs font-mono flex flex-col gap-1">
          {diff.oldContent !== null && (
            <details>
              <summary className="cursor-pointer text-text-muted">Old content</summary>
              <pre className={CODE_PRE}>{diff.oldContent}</pre>
            </details>
          )}
          {diff.newContent !== null && (
            <details>
              <summary className="cursor-pointer text-text-muted">New content</summary>
              <pre className={CODE_PRE}>{diff.newContent}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
