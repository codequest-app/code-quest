/** Live preview of the `git worktree add ...` command the dialog will run. */
export function CommandPreview({ command }: { command: string }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-mono rounded bg-bg/40 border border-border">
      <span className="text-text-muted">command</span>
      <span role="status" aria-label="worktree-command-preview" className="truncate">
        {command}
      </span>
    </div>
  );
}
