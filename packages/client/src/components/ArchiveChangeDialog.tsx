import { useState } from 'react';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { Button } from './ui/Button';
import { Dialog, DialogContent } from './ui/Dialog';
import { Spinner } from './ui/Spinner';

export interface ArchiveChangeDialogProps {
  open: boolean;
  name: string;
  onSubmit: (opts: { skipSpecs: boolean }) => void | Promise<void>;
  onClose: () => void;
}

export function ArchiveChangeDialog({ open, name, onSubmit, onClose }: ArchiveChangeDialogProps) {
  const [skipSpecs, setSkipSpecs] = useState(false);
  const submit = useAsyncAction(() => Promise.resolve(onSubmit({ skipSpecs })));

  function reset() {
    setSkipSpecs(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent title="Archive change" size="md">
        <div className="flex flex-col gap-3">
          <p className="text-xs text-text-muted">
            Archive <span className="font-mono text-text">{name}</span>?
          </p>
          <p className="text-xs text-text-dim leading-relaxed">
            This moves the change to <code className="font-mono">openspec/changes/archive/</code>{' '}
            and (unless you tick the box below) propagates its delta specs into the main specs tree.
          </p>
          <label className="flex items-start gap-2 text-xs text-text-muted">
            <input
              type="checkbox"
              checked={skipSpecs}
              onChange={(e) => setSkipSpecs(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Skip spec update (<code className="font-mono">--skip-specs</code>) — for
              infrastructure / tooling / doc-only changes that don't modify specs.
            </span>
          </label>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={submit.pending}
              onClick={() => void submit.run()}
            >
              {submit.pending && <Spinner className="w-3 h-3 mr-1.5" />}
              Archive
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
