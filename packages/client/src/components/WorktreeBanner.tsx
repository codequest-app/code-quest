interface WorktreeBannerProps {
  worktree: { name: string; path: string };
}

export function WorktreeBanner({ worktree }: WorktreeBannerProps) {
  return (
    <div
      data-testid="worktree-banner"
      className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs bg-accent/10 border-b border-accent/20"
    >
      <div className="flex items-center gap-2">
        <span className="text-accent font-medium">worktree</span>
        <span className="text-text font-mono">{worktree.name}</span>
      </div>
    </div>
  );
}
