import { FolderIcon, StarIcon as StarOutline } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { useContext, useRef, useState } from 'react';
import { ProjectActionsContext } from '../contexts/ProjectContext';
import { SessionStateContext } from '../contexts/SessionContext';
import { basename } from '../utils/basename';
import { cn } from '../utils/cn';
import { CreateWorktreeDialog } from './CreateWorktreeDialog';
import { ProjectContextMenu } from './ProjectContextMenu';
import { RemoveProjectConfirmDialog } from './RemoveProjectConfirmDialog';
import { RenameProjectDialog } from './RenameProjectDialog';
import { ResumeSessionsDropdown } from './ResumeSessionsDropdown';

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
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [worktreeDialogOpen, setWorktreeDialogOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const moreBtnRef = useRef<HTMLButtonElement>(null);

  // Wire actions (only if inside ProjectProvider — parent tests may not wrap).
  // Non-throwing reads: null outside providers (minimal component tests / Storybook).
  const actions = useContext(ProjectActionsContext);
  const sessionState = useContext(SessionStateContext);

  function handleContextMenu(e: React.MouseEvent) {
    if (!cwd) return;
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
  }

  function handleMoreClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (!cwd) return;
    const rect = moreBtnRef.current?.getBoundingClientRect();
    if (rect) setMenuPos({ x: rect.left, y: rect.bottom + 4 });
  }

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
      <div
        className={cn(
          'group relative my-0.5 rounded',
          active ? 'bg-accent/10' : 'hover:bg-white/5',
        )}
      >
        <button
          type="button"
          className={cn(
            'flex items-center gap-1.5 px-2 py-1.5 text-[13px] w-full min-w-0 text-left',
            active ? 'text-text' : 'text-text-muted group-hover:text-text',
            actions && cwd ? 'pr-12' : '',
          )}
          title={cwd ?? label}
          onClick={onSelect}
          onContextMenu={handleContextMenu}
        >
          <FolderIcon className="w-4 h-4 shrink-0" />
          <span className="truncate flex-1 font-medium">{label}</span>
          {worktreeCount && worktreeCount > 0 ? (
            <span className="shrink-0 font-mono text-[10px] text-text-subtle">
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
            <button
              ref={moreBtnRef}
              type="button"
              aria-label="More actions"
              title="More"
              onClick={handleMoreClick}
              className="shrink-0 px-1 text-text-muted hover:text-text opacity-0 group-hover:opacity-100"
            >
              ⋯
            </button>
          </div>
        ) : null}
      </div>
      {menuPos && (
        <ProjectContextMenu
          x={menuPos.x}
          y={menuPos.y}
          onSelectResume={() => {
            setMenuPos(null);
            setDialogOpen(true);
          }}
          onSelectCreateWorktree={() => {
            setMenuPos(null);
            setWorktreeDialogOpen(true);
          }}
          onSelectRename={
            actions && cwd
              ? () => {
                  setMenuPos(null);
                  setRenameOpen(true);
                }
              : undefined
          }
          onSelectRemove={
            actions && cwd
              ? () => {
                  setMenuPos(null);
                  setRemoveOpen(true);
                }
              : undefined
          }
          onSelectInitRepo={
            onSelectInitRepo
              ? () => {
                  setMenuPos(null);
                  onSelectInitRepo();
                }
              : undefined
          }
          onClose={() => setMenuPos(null)}
        />
      )}
      {cwd && dialogOpen && (
        <ResumeSessionsDropdown cwd={cwd} open={dialogOpen} onOpenChange={setDialogOpen} />
      )}
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
