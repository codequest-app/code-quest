import { FolderIcon, StarIcon as StarOutline } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import * as Popover from '@radix-ui/react-popover';
import { useContext, useState } from 'react';
import { NavigationActionsContext } from '../contexts/NavigationContext';
import { ProjectActionsContext } from '../contexts/ProjectContext';
import { SessionStateContext } from '../contexts/SessionContext';
import { basename } from '../utils/basename';
import { cn } from '../utils/cn';
import { CreateWorktreeDialog } from './CreateWorktreeDialog';
import {
  ProjectContextMenu,
  ProjectDropdownMenu,
  type ProjectMenuCallbacks,
} from './ProjectContextMenu';
import { RemoveProjectConfirmDialog } from './RemoveProjectConfirmDialog';
import { RenameProjectDialog } from './RenameProjectDialog';
import { SessionHistoryPopover } from './SessionHistoryPopover';

/** Display name preferring basename when name still looks like a full path
 *  (legacy data backfilled before basename extraction was applied). */
function displayName(name: string, cwd?: string): string {
  if (name.includes('/')) return basename(name);
  if (!name && cwd) return basename(cwd);
  return name;
}

export function ProjectCard({
  name,
  cwd,
  active,
  pinned = false,
  onSelect,
  onSelectInitRepo,
  worktreeCount,
}: {
  name: string;
  cwd?: string;
  active: boolean;
  pinned?: boolean;
  onSelect: () => void;
  /** Only passed for non-git projects — when present, ⋯ menu shows "Initialize as git repo". */
  onSelectInitRepo?: () => void;
  /** When provided and > 0, renders a `{n}wt` meta badge next to the name. */
  worktreeCount?: number;
}) {
  const [resumeOpen, setResumeOpen] = useState(false);
  const [worktreeDialogOpen, setWorktreeDialogOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  const actions = useContext(ProjectActionsContext);
  const navActions = useContext(NavigationActionsContext);
  const sessionState = useContext(SessionStateContext);

  const handleResumed = (spawnedId: string, picked: { cwd?: string }) => {
    const targetCwd = picked.cwd ?? cwd;
    if (targetCwd) {
      actions?.setActiveProject(targetCwd);
      navActions?.requestActivateChannel(targetCwd, spawnedId);
    }
  };

  const menuCallbacks: ProjectMenuCallbacks = {
    onSelectResume: () => setResumeOpen(true),
    onSelectCreateWorktree: () => setWorktreeDialogOpen(true),
    onSelectRename: actions && cwd ? () => setRenameOpen(true) : undefined,
    onSelectRemove: actions && cwd ? () => setRemoveOpen(true) : undefined,
    onSelectInitRepo: onSelectInitRepo,
  };

  function handleTogglePin(e: React.MouseEvent) {
    e.stopPropagation();
    if (!cwd || !actions) return;
    actions.pinProject(cwd, !pinned);
  }

  const activeSessionCount = cwd
    ? (sessionState?.sessions ?? []).filter((s) => s.projectRoot === cwd && s.state !== 'exited')
        .length
    : 0;

  const label = displayName(name, cwd);

  return (
    <>
      <Popover.Root open={resumeOpen} onOpenChange={setResumeOpen}>
        <ProjectContextMenu disabled={!cwd} {...menuCallbacks}>
          <Popover.Anchor asChild>
            <div
              className={cn(
                'group relative my-0.5 rounded',
                active ? 'bg-accent/10' : 'hover:bg-white/5',
              )}
            >
              <button
                type="button"
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1.5 text-xs w-full min-w-0 text-left',
                  active ? 'text-text' : 'text-text-muted group-hover:text-text',
                  actions && cwd ? 'pr-12' : '',
                )}
                title={cwd ?? label}
                onClick={onSelect}
              >
                <FolderIcon className="w-4 h-4 shrink-0" />
                <span className="truncate flex-1 font-medium">{label}</span>
                {worktreeCount && worktreeCount > 0 ? (
                  <span className="shrink-0 font-mono text-xs text-text-subtle">
                    {worktreeCount}wt
                  </span>
                ) : null}
              </button>
              {actions && cwd ? (
                <div className="absolute top-1/2 -translate-y-1/2 right-1 flex items-center gap-0.5">
                  <button
                    type="button"
                    aria-label={pinned ? 'Unpin' : 'Pin'}
                    title={pinned ? 'Unpin' : 'Pin'}
                    onClick={handleTogglePin}
                    className={cn(
                      'shrink-0 p-0.5 rounded hover:text-text',
                      pinned ? 'text-accent' : 'text-text-muted opacity-0 group-hover:opacity-100',
                    )}
                  >
                    {pinned ? (
                      <StarSolid className="w-3.5 h-3.5" />
                    ) : (
                      <StarOutline className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <ProjectDropdownMenu
                    trigger={
                      <button
                        type="button"
                        aria-label="More actions"
                        title="More"
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0 px-1 text-text-muted hover:text-text opacity-0 group-hover:opacity-100"
                      >
                        ⋯
                      </button>
                    }
                    {...menuCallbacks}
                  />
                </div>
              ) : null}
            </div>
          </Popover.Anchor>
        </ProjectContextMenu>
        {cwd && resumeOpen && (
          <SessionHistoryPopover
            cwd={cwd}
            onClose={() => setResumeOpen(false)}
            onResumed={handleResumed}
          />
        )}
      </Popover.Root>
      {cwd && worktreeDialogOpen && (
        <CreateWorktreeDialog
          open={worktreeDialogOpen}
          cwd={cwd}
          onClose={() => setWorktreeDialogOpen(false)}
        />
      )}
      {actions && cwd && (
        <RenameProjectDialog
          open={renameOpen}
          currentName={label}
          onRename={(newName) => {
            actions.renameProject(cwd, newName);
          }}
          onClose={() => setRenameOpen(false)}
        />
      )}
      {actions && cwd && (
        <RemoveProjectConfirmDialog
          open={removeOpen}
          projectName={label}
          activeSessionCount={activeSessionCount}
          onConfirm={() => {
            actions.removeProject(cwd);
          }}
          onClose={() => setRemoveOpen(false)}
        />
      )}
    </>
  );
}
