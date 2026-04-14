import { useContext, useEffect, useRef } from 'react';
import { ProjectStateContext } from '../contexts/ProjectContext';

interface ProjectContextMenuProps {
  x: number;
  y: number;
  onSelectResume: () => void;
  onSelectCreateWorktree?: () => void;
  onClose: () => void;
}

export function ProjectContextMenu({
  x,
  y,
  onSelectResume,
  onSelectCreateWorktree,
  onClose,
}: ProjectContextMenuProps) {
  const capabilities = useContext(ProjectStateContext)?.capabilities ?? { worktree: false };
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="menu"
      style={{ position: 'fixed', left: `${x}px`, top: `${y}px` }}
      className="z-50 min-w-[180px] rounded border border-border bg-surface shadow-lg py-1"
    >
      <button
        type="button"
        role="menuitem"
        onClick={onSelectResume}
        className="w-full text-left px-3 py-1.5 text-sm text-text hover:bg-white/5"
      >
        Resume session…
      </button>
      {capabilities.worktree && onSelectCreateWorktree ? (
        <button
          type="button"
          role="menuitem"
          onClick={onSelectCreateWorktree}
          className="w-full text-left px-3 py-1.5 text-sm text-text hover:bg-white/5"
        >
          Create Worktree…
        </button>
      ) : null}
    </div>
  );
}
