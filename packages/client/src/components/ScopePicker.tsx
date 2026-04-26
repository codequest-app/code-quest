import * as Popover from '@radix-ui/react-popover';
import { useMemo, useState } from 'react';
import { NOT_A_REPO, useGitState } from '../contexts/GitContext';
import { useProjectState } from '../contexts/ProjectContext';
import { useRightPaneCwd, useRightPaneScopeActions } from '../contexts/RightPaneScopeContext';
import { basename } from '../utils/basename';
import { cn } from '../utils/cn';

interface WorktreeOption {
  projectName: string;
  worktreePath: string;
  branch: string;
  label: string;
}

function useWorktreeOptions(): WorktreeOption[] {
  const { projects } = useProjectState();
  const { listing } = useGitState();

  return useMemo(
    () =>
      projects.flatMap((project) => {
        const entry = listing[project.cwd];
        if (!entry || entry === NOT_A_REPO) return [];
        return entry.map((wt) => ({
          projectName: project.name,
          worktreePath: wt.path,
          branch: wt.branch ?? wt.name,
          label: `${project.name} · ⎇ ${wt.branch ?? wt.name}`,
        }));
      }),
    [projects, listing],
  );
}

function useScopeLabel(options: WorktreeOption[]): { projectName: string; branch: string } | null {
  const cwd = useRightPaneCwd();

  if (!cwd) return null;

  const match = options.find((o) => o.worktreePath === cwd);
  if (match) return { projectName: match.projectName, branch: match.branch };
  return { projectName: basename(cwd), branch: '' };
}

export function ScopePicker({ disabled }: { disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const { scope, pinTo, unpin } = useRightPaneScopeActions();
  const options = useWorktreeOptions();
  const scopeLabel = useScopeLabel(options);

  const pinnedCwd = scope.mode === 'pinned' ? scope.cwd : null;

  function handleSelect(cwd: string) {
    pinTo(cwd);
    setOpen(false);
  }

  function handleFollow() {
    unpin();
    setOpen(false);
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          data-testid="scope-picker-trigger"
          disabled={disabled}
          className={cn(
            'flex-1 min-w-0 inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-2xs cursor-pointer',
            'hover:border-accent disabled:cursor-not-allowed disabled:opacity-50',
            scopeLabel
              ? 'border-border bg-white/[.04] text-text'
              : 'border-transparent text-text-muted',
          )}
        >
          {scopeLabel ? (
            <>
              <span data-testid="pane-bar-scope-label" className="text-text-muted truncate">
                {scopeLabel.projectName}
              </span>
              {scopeLabel.branch && (
                <>
                  <span className="text-text-muted">·</span>
                  <span className="text-accent font-mono whitespace-nowrap">
                    ⎇ {scopeLabel.branch}
                  </span>
                </>
              )}
            </>
          ) : (
            <span data-testid="pane-bar-scope-label">— no scope —</span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className="w-64 z-modal rounded border border-border bg-surface shadow-lg flex flex-col max-h-72"
        >
          <div className="px-3 py-1.5 text-2xs font-semibold uppercase tracking-wider text-text-muted border-b border-border">
            Pin sidebar to
          </div>
          <div className="flex-1 overflow-auto py-1">
            {options.length === 0 ? (
              <div className="px-3 py-4 text-xs text-text-muted text-center">No worktrees</div>
            ) : (
              options.map((opt) => (
                <button
                  key={opt.worktreePath}
                  type="button"
                  data-testid="scope-item"
                  onClick={() => handleSelect(opt.worktreePath)}
                  className={cn(
                    'w-full text-left px-3 py-1 text-xs flex items-center gap-2',
                    pinnedCwd === opt.worktreePath
                      ? 'text-accent bg-accent/10'
                      : 'text-text hover:bg-white/5',
                  )}
                >
                  <span data-check className="w-3 shrink-0 text-center text-2xs">
                    {pinnedCwd === opt.worktreePath ? '✓' : ''}
                  </span>
                  <span className="truncate">{opt.label}</span>
                </button>
              ))
            )}
          </div>
          <div className="border-t border-border p-1">
            <button
              type="button"
              onClick={handleFollow}
              className="w-full text-left px-3 py-1.5 rounded text-xs text-text-muted hover:bg-white/5 flex items-center gap-2"
            >
              <span className="w-3 shrink-0 text-center text-2xs">⇆</span>
              <span>Follow active chat tab</span>
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
