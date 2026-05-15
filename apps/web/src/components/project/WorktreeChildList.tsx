import type { WorktreeInfo } from '@code-quest/shared';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useGitActions } from '@/contexts/GitContext';
import { useNavigationActions, useNavigationState } from '@/contexts/NavigationContext';
import { useProjectActions } from '@/contexts/ProjectContext';
import { useSession } from '@/contexts/SessionContext';
import { GhostAddButton } from '../ui/GhostAddButton.tsx';
import { ArchiveWorktreeConfirmDialog } from './ArchiveWorktreeConfirmDialog.tsx';
import { BranchPopover } from './BranchPopover.tsx';
import { CreateWorktreeDialog } from './CreateWorktreeDialog.tsx';
import { RemoveWorktreeConfirmDialog } from './RemoveWorktreeConfirmDialog.tsx';
import { RenameWorktreeDialog } from './RenameWorktreeDialog.tsx';
import { WorktreeContextMenu, WorktreeDropdownMenu } from './WorktreeContextMenu.tsx';
import { WorktreeRow } from './WorktreeRow.tsx';

/** Dialogs (not menus/popovers) are still centrally owned since only one is
 *  visible at a time. Menus/popovers are now per-row Radix state. */
type Dialog =
  | { kind: 'remove'; wt: WorktreeInfo; activeCount: number }
  | { kind: 'rename'; wt: WorktreeInfo }
  | { kind: 'archive'; wt: WorktreeInfo; dirty: boolean }
  | { kind: 'create' }
  | null;

export function WorktreeChildList({
  worktrees,
  projectCwd,
}: {
  worktrees: WorktreeInfo[];
  projectCwd: string;
}): React.JSX.Element {
  const { sessions } = useSession();
  const { setActiveProject } = useProjectActions();
  const { requestOpenWorktree, setSelectedWorktree } = useNavigationActions();
  const { selectedWorktreeCwd } = useNavigationState();
  const { removeWorktree, listBranches, checkout, status, rename } = useGitActions();

  // Plain row click: activate project + remember sidebar selection. Does NOT
  // open chat — user clicks `+` on the tab strip when ready.
  const selectWorktree = (pCwd: string, wCwd: string) => {
    setActiveProject(pCwd);
    setSelectedWorktree(pCwd, wCwd);
  };

  // Explicit chat-creation entry (context menu "Open in new chat").
  const openWorktreeInChat = (pCwd: string, wCwd: string, forceNew = false) => {
    setActiveProject(pCwd);
    setSelectedWorktree(pCwd, wCwd);
    requestOpenWorktree(pCwd, wCwd, forceNew);
  };

  const [dialog, setDialog] = useState<Dialog>(null);
  const closeDialog = () => setDialog(null);
  /** Which worktree's branch popover is open, and its loaded branch list. */
  const [branchPop, setBranchPop] = useState<{ wt: WorktreeInfo; branches: string[] } | null>(null);

  async function handleBranchPopoverOpen(wt: WorktreeInfo, open: boolean) {
    if (!open) {
      setBranchPop(null);
      return;
    }
    const res = await listBranches(projectCwd);
    const branches = Array.isArray(res) ? res : [];
    setBranchPop({ wt, branches });
  }

  // Server-sourced status (changed-file counts per worktree) — orthogonal to
  // UI overlays, keeps its own state.
  const [changesByPath, setChangesByPath] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const results = await Promise.all(
        worktrees.map((wt) => status(wt.path).then((res) => ({ wt, res }))),
      );
      if (cancelled) return;
      const updates: Record<string, number> = {};
      for (const { wt, res } of results) {
        if ('changedFilesCount' in res) {
          updates[wt.path] = res.changedFilesCount;
        }
      }
      setChangesByPath((prev) => ({ ...prev, ...updates }));
    })();
    return () => {
      cancelled = true;
    };
  }, [worktrees, status]);

  function liveCountFor(wt: WorktreeInfo): number {
    // Match by `cwd` (where the session actually runs), NOT `projectRoot`
    // (which is always the project root and would attribute every session
    // to the main worktree row).
    return sessions.filter((s) => s.cwd === wt.path && s.state !== 'exited').length;
  }

  return (
    <div className="ml-5 border-l border-border pl-2">
      {worktrees.map((wt) => {
        const menuCallbacks = {
          onOpenHere: () => openWorktreeInChat(projectCwd, wt.path),
          onOpenInNewChat: () => openWorktreeInChat(projectCwd, wt.path, true),
          onCopyPath: () => {
            void navigator.clipboard?.writeText(wt.path);
          },
          onRename: () => setDialog({ kind: 'rename', wt }),
          onArchive: () => setDialog({ kind: 'archive', wt, dirty: false }),
          onDelete: () => setDialog({ kind: 'remove', wt, activeCount: liveCountFor(wt) }),
        };
        return (
          <WorktreeContextMenu key={wt.name} {...menuCallbacks}>
            <WorktreeRow
              worktree={wt}
              active={selectedWorktreeCwd[projectCwd] === wt.path}
              liveSessions={liveCountFor(wt)}
              changes={changesByPath[wt.path] ?? 0}
              onSelect={() => selectWorktree(projectCwd, wt.path)}
              wrapBranchTrigger={(badge) => (
                <BranchPopover
                  trigger={badge}
                  open={branchPop?.wt.path === wt.path}
                  onOpenChange={(o) => void handleBranchPopoverOpen(wt, o)}
                  branches={branchPop?.wt.path === wt.path ? branchPop.branches : []}
                  current={wt.branch ?? null}
                  onSelect={(branch) => {
                    void checkout(wt.path, branch);
                  }}
                  onCreateBranch={() => setDialog({ kind: 'create' })}
                />
              )}
              wrapMoreTrigger={(btn) => <WorktreeDropdownMenu trigger={btn} {...menuCallbacks} />}
            />
          </WorktreeContextMenu>
        );
      })}
      {dialog?.kind === 'rename' && (
        <RenameWorktreeDialog
          open
          currentBranch={dialog.wt.branch ?? dialog.wt.name}
          onSubmit={async (newName) => {
            const result = await rename(dialog.wt.path, newName);
            if ('error' in result) {
              toast.error(`Rename failed: ${result.error}`);
            } else {
              toast.success(`Renamed to ${result.branch}`);
            }
            closeDialog();
          }}
          onClose={closeDialog}
        />
      )}
      {dialog?.kind === 'archive' && (
        <ArchiveWorktreeConfirmDialog
          open
          branch={dialog.wt.branch ?? dialog.wt.name}
          dirty={dialog.dirty}
          onConfirm={async ({ force }) => {
            const result = await removeWorktree(projectCwd, dialog.wt.name, { force });
            if ('error' in result) {
              if (result.error === 'dirty') {
                setDialog({ kind: 'archive', wt: dialog.wt, dirty: true });
                return;
              }
              toast.error(`Archive failed: ${result.error}`);
              closeDialog();
              return;
            }
            toast.success(`Archived ${dialog.wt.name}`);
            closeDialog();
          }}
          onClose={closeDialog}
        />
      )}
      {dialog?.kind === 'remove' && (
        <RemoveWorktreeConfirmDialog
          open
          branch={dialog.wt.branch ?? dialog.wt.name}
          activeSessionCount={dialog.activeCount}
          onConfirm={() => {
            void removeWorktree(projectCwd, dialog.wt.name, { force: true });
          }}
          onClose={closeDialog}
        />
      )}
      <GhostAddButton
        onClick={() => setDialog({ kind: 'create' })}
        className="my-1 ml-2 px-2 py-1 text-left"
      >
        + New worktree…
      </GhostAddButton>
      {dialog?.kind === 'create' && (
        <CreateWorktreeDialog open cwd={projectCwd} onClose={closeDialog} />
      )}
    </div>
  );
}
