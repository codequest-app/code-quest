import { useContext, useEffect, useRef } from 'react';
import { AppReadinessStateContext } from '../contexts/AppReadinessContext';

interface ProjectContextMenuProps {
  x: number;
  y: number;
  onSelectResume: () => void;
  onSelectCreateWorktree?: () => void;
  onSelectRename?: () => void;
  onSelectRemove?: () => void;
  onSelectInitRepo?: () => void;
  onClose: () => void;
}

export function ProjectContextMenu({
  x,
  y,
  onSelectResume,
  onSelectCreateWorktree,
  onSelectRename,
  onSelectRemove,
  onSelectInitRepo,
  onClose,
}: ProjectContextMenuProps) {
  const capabilities = useContext(AppReadinessStateContext)?.capabilities ?? { worktree: false };
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
      className="z-modal min-w-45 rounded border border-border bg-surface shadow-lg py-1"
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
      {onSelectInitRepo ? (
        <button
          type="button"
          role="menuitem"
          onClick={onSelectInitRepo}
          className="w-full text-left px-3 py-1.5 text-sm text-text hover:bg-white/5"
        >
          Initialize as git repo
        </button>
      ) : null}
      {onSelectRename ? (
        <button
          type="button"
          role="menuitem"
          onClick={onSelectRename}
          className="w-full text-left px-3 py-1.5 text-sm text-text hover:bg-white/5"
        >
          Rename…
        </button>
      ) : null}
      {onSelectRemove ? (
        <>
          <div className="my-1 border-t border-border" />
          <button
            type="button"
            role="menuitem"
            onClick={onSelectRemove}
            className="w-full text-left px-3 py-1.5 text-sm text-danger hover:bg-danger/10"
          >
            Remove…
          </button>
        </>
      ) : null}
    </div>
  );
}
