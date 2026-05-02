import { useState } from 'react';
import { Button } from '../ui/Button.tsx';
import { Dialog, DialogContent } from '../ui/Dialog.tsx';

const VALID_NAME = /^[\w.\-+]+$/;

interface NewEntryDialogProps {
  open: boolean;
  kind: 'file' | 'directory';
  /** Directory the new entry will be created inside (for the title text). */
  parentLabel: string;
  onSubmit: (name: string) => void | Promise<void>;
  onClose: () => void;
}

export function NewEntryDialog({
  open,
  kind,
  parentLabel,
  onSubmit,
  onClose,
}: NewEntryDialogProps): React.JSX.Element {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setName('');
    setError(null);
    setSubmitting(false);
  }

  async function submit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name is required');
      return;
    }
    if (!VALID_NAME.test(trimmed)) {
      setError('Letters, digits, dot, dash, underscore, plus only');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
    } finally {
      setSubmitting(false);
    }
  }

  const title = kind === 'directory' ? 'New folder' : 'New file';
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
      <DialogContent title={title} size="md">
        <div className="flex flex-col gap-3">
          <p className="text-xs text-text-dim">
            In <span className="font-mono text-text">{parentLabel}</span>
          </p>
          <label className="text-xs text-text-muted">
            Name
            <input
              type="text"
              value={name}
              autoFocus
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void submit();
              }}
              className="mt-1 w-full px-2 py-1 rounded border border-border bg-bg/40 text-sm text-text font-mono"
            />
          </label>
          {error && <p className="text-xs text-warn">{error}</p>}
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" disabled={submitting} onClick={() => void submit()}>
              {submitting ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
