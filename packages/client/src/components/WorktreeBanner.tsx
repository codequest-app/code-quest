import type { WorktreeInfo } from '@code-quest/shared';
import { useChannelConfig } from '../contexts/channel';

interface WorktreeBannerProps {
  worktree: WorktreeInfo;
}

export function WorktreeBanner({ worktree }: WorktreeBannerProps) {
  const { openNewChannel } = useChannelConfig();

  return (
    <section
      aria-label="worktree-banner"
      className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs bg-accent/10 border-b border-accent/20"
    >
      <div className="flex items-center gap-2">
        <span className="text-accent font-medium">This session is in worktree</span>
        <span className="text-text font-mono">{worktree.name}</span>
      </div>
      <button
        type="button"
        aria-label="Open in new tab"
        onClick={() => openNewChannel(worktree.path)}
        className="text-accent hover:text-text text-xs cursor-pointer bg-transparent border-0 hover:underline"
      >
        Open in new tab
      </button>
    </section>
  );
}
