import { useState } from 'react';
import { Button } from '../ui/Button.tsx';
import { Dialog, DialogContent } from '../ui/Dialog.tsx';

export interface DeleteEntryConfirmDialogProps {
  open: boolean;
  name: string;
  /** Set when target is a non-empty directory; shows the descendant warning. */
  descendantCount?: number;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export function DeleteEntryConfirmDialog({
  open,
  name,
  descendantCount,
  onConfirm,
  onClose,
}: DeleteEntryConfirmDialogProps): React.JSX.Element {
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setSubmitting(false);
    }
  }

  const message =
    descendantCount && descendantCount > 0
      ? `Delete ${name}/ and ${descendantCount} item${descendantCount === 1 ? '' : 's'} inside?`
      : `Delete ${name}?`;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Delete" size="md">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-text">{message}</p>
          <p className="text-xs text-text-dim">This cannot be undone.</p>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" disabled={submitting} onClick={() => void submit()}>
              {submitting ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
