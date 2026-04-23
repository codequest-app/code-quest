import type { WorktreeInfo } from '@code-quest/shared';
import { useEffect, useState } from 'react';
import { useNavigationActions } from '../contexts/NavigationContext';
import { useProjectActions } from '../contexts/ProjectContext';
import { useSession } from '../contexts/SessionContext';
import { useWorktreeActions } from '../contexts/WorktreeContext';
import { BranchPopover } from './BranchPopover';
import { CreateWorktreeDialog } from './CreateWorktreeDialog';
import { RemoveWorktreeConfirmDialog } from './RemoveWorktreeConfirmDialog';
import { WorktreeContextMenu } from './WorktreeContextMenu';
import { WorktreeRow } from './WorktreeRow';

/** At most one of menu / remove / create / branch-popover is visible at a
 *  time — one discriminated union instead of four booleans prevents
 *  impossible combinations (e.g. "menu open while create dialog open"). */
type Overlay =
  | { kind: 'menu'; wt: WorktreeInfo; x: number; y: number }
  | { kind: 'remove'; wt: WorktreeInfo; activeCount: number }
  | { kind: 'create' }
  | { kind: 'branchPopover'; wt: WorktreeInfo; x: number; y: number; branches: string[] }
  | null;

export function WorktreeChildList({
  worktrees,
  projectCwd,
}: {
  worktrees: WorktreeInfo[];
  projectCwd: string;
}) {
  const { sessions } = useSession();
  const { setActiveProject } = useProjectActions();
  const { requestOpenWorktree } = useNavigationActions();
  const { remove, listBranches, checkout, status } = useWorktreeActions();

  // Open-or-switch a worktree: activate its project so the right TabProvider
  // mounts, then fire the navigation intent for it to consume.
  const openWorktree = (pCwd: string, wCwd: string, forceNew = false) => {
    setActiveProject(pCwd);
    requestOpenWorktree(pCwd, wCwd, forceNew);
  };

  const [overlay, setOverlay] = useState<Overlay>(null);
  const closeOverlay = () => setOverlay(null);

  // Server-sourced status (changed-file counts per worktree) — orthogonal to
  // UI overlays, keeps its own state.
  const [changesByPath, setChangesByPath] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    for (const wt of worktrees) {
      void (async () => {
        const res = await status(wt.path);
        if (cancelled) return;
        if ('changedFilesCount' in res) {
          setChangesByPath((prev) => ({ ...prev, [wt.path]: res.changedFilesCount }));
        }
      })();
    }
    return () => {
      cancelled = true;
    };
  }, [worktrees, status]);

  function liveCountFor(wt: WorktreeInfo): number {
    return sessions.filter((s) => s.projectRoot === wt.path && s.state !== 'exited').length;
  }

  return (
    <div className="ml-5 border-l border-border pl-2">
      {worktrees.map((wt) => (
        <WorktreeRow
          key={wt.name}
          worktree={wt}
          active={false}
          liveSessions={liveCountFor(wt)}
          changes={changesByPath[wt.path] ?? 0}
          onSelect={() => openWorktree(projectCwd, wt.path)}
          onBranchClick={async (anchor) => {
            const res = await listBranches(projectCwd);
            const branches = Array.isArray(res) ? res : [];
            setOverlay({ kind: 'branchPopover', wt, ...anchor, branches });
          }}
          onMoreActions={(anchor) => setOverlay({ kind: 'menu', wt, ...anchor })}
        />
      ))}
      {overlay?.kind === 'menu' && (
        <WorktreeContextMenu
          x={overlay.x}
          y={overlay.y}
          onOpenHere={() => openWorktree(projectCwd, overlay.wt.path)}
          onOpenInNewChat={() => openWorktree(projectCwd, overlay.wt.path, true)}
          onCopyPath={() => {
            void navigator.clipboard?.writeText(overlay.wt.path);
          }}
          onRename={() => {
            // TBD: `git worktree move` + branch rename — needs server support.
            console.info('Rename worktree: not yet implemented');
          }}
          onArchive={() => {
            // TBD: semantics unclear (move to archive dir? mark as archived?).
            console.info('Archive worktree: not yet implemented');
          }}
          onDelete={() =>
            setOverlay({ kind: 'remove', wt: overlay.wt, activeCount: liveCountFor(overlay.wt) })
          }
          onClose={closeOverlay}
        />
      )}
      {overlay?.kind === 'remove' && (
        <RemoveWorktreeConfirmDialog
          open
          branch={overlay.wt.branch ?? overlay.wt.name}
          activeSessionCount={overlay.activeCount}
          onConfirm={() => {
            void remove(projectCwd, overlay.wt.name);
          }}
          onClose={closeOverlay}
        />
      )}
      <button
        type="button"
        onClick={() => setOverlay({ kind: 'create' })}
        className="my-1 ml-2 px-2 py-1 text-[11px] text-left rounded border border-dashed border-border bg-transparent text-text-muted hover:text-text hover:border-accent"
      >
        + New worktree…
      </button>
      {overlay?.kind === 'create' && (
        <CreateWorktreeDialog open cwd={projectCwd} onClose={closeOverlay} />
      )}
      {overlay?.kind === 'branchPopover' && (
        <BranchPopover
          x={overlay.x}
          y={overlay.y}
          branches={overlay.branches}
          current={overlay.wt.branch ?? null}
          onSelect={(branch) => {
            void checkout(overlay.wt.path, branch);
          }}
          onCreateBranch={() => setOverlay({ kind: 'create' })}
          onClose={closeOverlay}
        />
      )}
    </div>
  );
}
