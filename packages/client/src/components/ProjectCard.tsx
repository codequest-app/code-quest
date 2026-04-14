import { useState } from 'react';
import { CreateWorktreeDialog } from './CreateWorktreeDialog';
import { ProjectContextMenu } from './ProjectContextMenu';
import { ResumeSessionsDialog } from './ResumeSessionsDialog';

export function ProjectCard({
  name,
  cwd,
  active,
  onSelect,
}: {
  name: string;
  cwd?: string;
  active: boolean;
  onSelect: () => void;
}) {
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [worktreeDialogOpen, setWorktreeDialogOpen] = useState(false);

  function handleContextMenu(e: React.MouseEvent) {
    if (!cwd) return;
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
  }

  return (
    <>
      <button
        type="button"
        className={`mx-2 my-1 px-3 py-2 rounded cursor-pointer text-sm text-left w-[calc(100%-16px)] ${
          active
            ? 'border border-accent bg-accent/10 text-text'
            : 'border border-transparent hover:bg-white/5 text-text-muted'
        }`}
        onClick={onSelect}
        onContextMenu={handleContextMenu}
      >
        📁 {name}
      </button>
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
          onClose={() => setMenuPos(null)}
        />
      )}
      {cwd && dialogOpen && (
        <ResumeSessionsDialog cwd={cwd} open={dialogOpen} onOpenChange={setDialogOpen} />
      )}
      {cwd && worktreeDialogOpen && (
        <CreateWorktreeDialog
          open={worktreeDialogOpen}
          cwd={cwd}
          onClose={() => setWorktreeDialogOpen(false)}
        />
      )}
    </>
  );
}
