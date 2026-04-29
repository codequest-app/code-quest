import { useState } from 'react';
import { Button } from '../ui/Button';
import { Dialog, DialogContent } from '../ui/Dialog';

const VALID_SLUG = /^[a-z0-9-]+$/;

export interface NewChangeDialogProps {
  open: boolean;
  onSubmit: (name: string) => void | Promise<void>;
  onClose: () => void;
}

export function NewChangeDialog({
  open,
  onSubmit,
  onClose,
}: NewChangeDialogProps): React.JSX.Element {
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
    if (!VALID_SLUG.test(trimmed)) {
      setError('Only lowercase letters, digits, and hyphens');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
    } finally {
      setSubmitting(false);
    }
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
      <DialogContent title="New OpenSpec change" size="md">
        <div className="flex flex-col gap-3">
          <label className="text-xs text-text-muted">
            Change name (slug)
            <input
              type="text"
              value={name}
              autoFocus
              placeholder="e.g. add-dark-mode"
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
          <p className="text-xs text-text-dim">
            Runs <code className="font-mono">openspec change new &lt;name&gt;</code>.
          </p>
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
