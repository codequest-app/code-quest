import { validateWorktreeName } from '@code-quest/shared';
import { useState } from 'react';
import { useProjectActions } from '../contexts/ProjectContext';
import { useWorktreeActions } from '../contexts/WorktreeContext';
import { Dialog, DialogClose, DialogContent } from './ui/Dialog';

export function CreateWorktreeDialog({
  open,
  cwd,
  onClose,
}: {
  open: boolean;
  cwd: string;
  onClose: () => void;
}) {
  const { create } = useWorktreeActions();
  const { requestActivateChannel } = useProjectActions();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validateWorktreeName(name);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setIsCreating(true);
    try {
      const result = await create(cwd, name);
      if ('error' in result) {
        setError(result.error);
        return;
      }
      requestActivateChannel(cwd, result.channelId);
      setName('');
      onClose();
    } finally {
      setIsCreating(false);
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setName('');
      setError(null);
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent title="Create Worktree" className="w-[420px]">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <label htmlFor="worktree-name" className="text-xs text-text-muted">
            Worktree name
          </label>
          <input
            id="worktree-name"
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="feature-x"
            className="px-2 py-1.5 text-sm rounded border border-border bg-bg/60 focus:outline-none focus:border-accent"
          />
          {error ? <div className="text-xs text-red-500">{error}</div> : null}
          <div className="text-xs text-text-muted">
            Creates a git worktree at {cwd}/.claude/worktrees/&lt;name&gt; and opens a new session.
          </div>
          <div className="flex justify-end gap-2 -mx-4 -mb-4 px-4 py-3 border-t border-border mt-3">
            <DialogClose asChild>
              <button
                type="button"
                className="px-4 py-1.5 text-sm rounded border border-border hover:bg-white/5"
                disabled={isCreating}
              >
                Cancel
              </button>
            </DialogClose>
            <button
              type="submit"
              className="px-4 py-1.5 text-sm rounded bg-accent text-white disabled:opacity-40"
              disabled={isCreating || !name}
            >
              {isCreating ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
