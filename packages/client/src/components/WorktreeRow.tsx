import type { WorktreeInfo } from '@code-quest/shared';
import { cn } from '../utils/cn';
import { pluralize } from '../utils/pluralize';

export interface WorktreeRowProps {
  worktree: WorktreeInfo;
  active: boolean;
  liveSessions: number;
  /** Count of uncommitted changes (from `git status`). >0 triggers the warning dot. */
  changes: number;
  onSelect: () => void;
  onBranchClick: (anchor: { x: number; y: number }) => void;
  onMoreActions: (anchor: { x: number; y: number }) => void;
}

export function WorktreeRow({
  worktree,
  active,
  liveSessions,
  changes,
  onSelect,
  onBranchClick,
  onMoreActions,
}: WorktreeRowProps) {
  const label = worktree.branch ?? worktree.name;

  // Accepts both click and keyboard activation — only uses currentTarget + stopPropagation,
  // which the shared UIEvent base provides.
  function handleBranchActivate(e: React.UIEvent<HTMLSpanElement>) {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    onBranchClick({ x: rect.left, y: rect.bottom + 4 });
  }

  function handleMore(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    onMoreActions({ x: rect.left, y: rect.bottom + 4 });
  }

  return (
    <div
      className={cn(
        'group relative flex items-center gap-1.5 px-2 py-1 text-[12px] rounded border-l-2',
        active
          ? 'border-accent bg-white/5 text-text'
          : 'border-transparent text-text-muted hover:bg-white/5 hover:text-text',
      )}
    >
      <button
        type="button"
        aria-label={`Open worktree ${label}`}
        onClick={onSelect}
        className="flex flex-1 items-center gap-1.5 min-w-0 text-left"
      >
        {/* biome-ignore lint/a11y/useSemanticElements: span used to avoid nested <button> inside the row's open-worktree <button>; HTML disallows button-in-button */}
        <span
          data-testid="wt-branch"
          role="button"
          tabIndex={0}
          aria-label={`Switch branch (currently ${label})`}
          onClick={handleBranchActivate}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleBranchActivate(e);
            }
          }}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-border bg-white/[0.04] hover:border-accent hover:bg-white/10 cursor-pointer font-mono text-[11px] text-text-muted"
          title="Switch branch"
        >
          <span aria-hidden="true" className="text-text-subtle text-[10px]">
            ⎇
          </span>
          <span>{label}</span>
        </span>
      </button>
      {liveSessions > 0 && (
        <span
          role="status"
          aria-label={pluralize(liveSessions, 'active session')}
          className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-success/20 text-success"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          {liveSessions}
        </span>
      )}
      {changes > 0 && (
        <span
          data-testid="wt-changes-dot"
          aria-hidden="true"
          title={pluralize(changes, 'change')}
          className="w-2 h-2 rounded-full bg-warning shrink-0"
        />
      )}
      <button
        type="button"
        aria-label="More actions"
        title="More"
        onClick={handleMore}
        className="shrink-0 px-1 text-text-muted hover:text-text opacity-0 group-hover:opacity-100"
      >
        ⋯
      </button>
    </div>
  );
}
