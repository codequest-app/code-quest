import { useEffect, useRef } from 'react';

interface Props {
  x: number;
  y: number;
  onOpenHere?: () => void;
  onOpenInNewChat: () => void;
  onCopyPath: () => void;
  onRename?: () => void;
  onArchive?: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function WorktreeContextMenu({
  x,
  y,
  onOpenHere,
  onOpenInNewChat,
  onCopyPath,
  onRename,
  onArchive,
  onDelete,
  onClose,
}: Props) {
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

  function wrap(fn: () => void) {
    return () => {
      fn();
      onClose();
    };
  }

  return (
    <div
      ref={ref}
      role="menu"
      style={{ position: 'fixed', left: `${x}px`, top: `${y}px` }}
      className="z-modal min-w-45 rounded border border-border bg-surface shadow-lg py-1"
    >
      {onOpenHere ? (
        <button
          type="button"
          role="menuitem"
          onClick={wrap(onOpenHere)}
          className="w-full text-left px-3 py-1.5 text-sm text-text hover:bg-white/5"
        >
          Open here (switch)
        </button>
      ) : null}
      <button
        type="button"
        role="menuitem"
        onClick={wrap(onOpenInNewChat)}
        className="w-full text-left px-3 py-1.5 text-sm text-text hover:bg-white/5"
      >
        Open in new chat
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={wrap(onCopyPath)}
        className="w-full text-left px-3 py-1.5 text-sm text-text hover:bg-white/5"
      >
        Copy path
      </button>
      {onRename ? (
        <button
          type="button"
          role="menuitem"
          onClick={wrap(onRename)}
          className="w-full text-left px-3 py-1.5 text-sm text-text hover:bg-white/5"
        >
          Rename…
        </button>
      ) : null}
      {onArchive ? (
        <button
          type="button"
          role="menuitem"
          onClick={wrap(onArchive)}
          className="w-full text-left px-3 py-1.5 text-sm text-text hover:bg-white/5"
        >
          Archive
        </button>
      ) : null}
      <div className="my-1 border-t border-border" />
      <button
        type="button"
        role="menuitem"
        onClick={wrap(onDelete)}
        className="w-full text-left px-3 py-1.5 text-sm text-danger hover:bg-white/5"
      >
        Delete
      </button>
    </div>
  );
}
