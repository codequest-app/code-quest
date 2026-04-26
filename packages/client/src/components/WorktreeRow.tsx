import type { WorktreeInfo } from '@code-quest/shared';
import { forwardRef, type HTMLAttributes, type ReactElement, type ReactNode } from 'react';
import { cn } from '../utils/cn';
import { pluralize } from '../utils/pluralize';

export interface WorktreeRowProps extends HTMLAttributes<HTMLDivElement> {
  worktree: WorktreeInfo;
  active: boolean;
  liveSessions: number;
  /** Count of uncommitted changes (from `git status`). >0 triggers the warning dot. */
  changes: number;
  onSelect: () => void;
  /** Called when the branch badge is clicked (keyboard or mouse). */
  onBranchClick?: () => void;
  /** Called when the ⋯ "More actions" button is clicked. */
  onMoreActions?: () => void;
  /**
   * Parent-supplied wrapper that renders the branch badge as a Radix
   * trigger (e.g. `Popover.Trigger asChild`). When omitted, the badge is
   * a plain element that calls `onBranchClick` on activation.
   */
  wrapBranchTrigger?: (child: ReactElement) => ReactNode;
  /** Same as `wrapBranchTrigger` but for the ⋯ button (DropdownMenu.Trigger). */
  wrapMoreTrigger?: (child: ReactElement) => ReactNode;
}

export const WorktreeRow = forwardRef<HTMLDivElement, WorktreeRowProps>(function WorktreeRow(
  {
    worktree,
    active,
    liveSessions,
    changes,
    onSelect,
    onBranchClick,
    onMoreActions,
    wrapBranchTrigger,
    wrapMoreTrigger,
    className,
    ...rest
  },
  ref,
) {
  const label = worktree.branch ?? worktree.name;

  const branchBadge = (
    // biome-ignore lint/a11y/useSemanticElements: span avoids nested <button> — HTML disallows button-in-button
    <span
      role="button"
      tabIndex={0}
      aria-label={`Switch branch (currently ${label})`}
      onClick={(e) => {
        e.stopPropagation();
        onBranchClick?.();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onBranchClick?.();
        }
      }}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-border bg-white/[0.04] hover:border-accent hover:bg-white/10 cursor-pointer font-mono text-xs text-text-muted"
      title="Switch branch"
    >
      <span aria-hidden="true" className="text-text-subtle text-xs">
        ⎇
      </span>
      <span>{label}</span>
    </span>
  );

  const moreButton = (
    <button
      type="button"
      aria-label="More actions"
      title="More"
      onClick={(e) => {
        e.stopPropagation();
        onMoreActions?.();
      }}
      className="shrink-0 px-1 text-text-muted hover:text-text opacity-0 group-hover:opacity-100"
    >
      ⋯
    </button>
  );

  return (
    <div
      ref={ref}
      {...rest}
      className={cn(
        'group relative flex items-center gap-1.5 px-2 py-1 text-xs rounded border-l-2',
        active
          ? 'border-accent bg-white/5 text-text'
          : 'border-transparent text-text-muted hover:bg-white/5 hover:text-text',
        className,
      )}
    >
      <button
        type="button"
        aria-label={`Open worktree ${label}`}
        onClick={onSelect}
        className="flex flex-1 items-center gap-1.5 min-w-0 text-left"
      >
        {wrapBranchTrigger ? wrapBranchTrigger(branchBadge) : branchBadge}
      </button>
      {liveSessions > 0 && (
        <span
          role="status"
          aria-label={pluralize(liveSessions, 'active session')}
          className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-success/20 text-success"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          {liveSessions}
        </span>
      )}
      {changes > 0 && (
        <span
          role="status"
          aria-label={pluralize(changes, 'change')}
          title={pluralize(changes, 'change')}
          className="w-2 h-2 rounded-full bg-warning shrink-0"
        />
      )}
      {wrapMoreTrigger ? wrapMoreTrigger(moreButton) : moreButton}
    </div>
  );
});
