import { useState } from 'react';
import { DirectoryTree } from './DirectoryTree';

export function AddProjectDialog({
  open,
  onSelect,
  onClose,
}: {
  open: boolean;
  onSelect: (cwd: string) => void;
  onClose: () => void;
}) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  if (!open) return null;

  function handleOpen() {
    if (selectedPath) {
      onSelect(selectedPath);
      onClose();
      setSelectedPath(null);
    }
  }

  function handleClose() {
    setSelectedPath(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/60">
      <div className="bg-surface border border-border rounded-lg shadow-xl w-[480px] max-h-[70vh] flex flex-col">
        <div className="px-4 py-3 border-b border-border font-semibold text-sm">
          Select Project Directory
        </div>
        {selectedPath && (
          <div className="px-4 py-1.5 text-xs text-text-muted truncate border-b border-border bg-bg/30">
            {selectedPath}
          </div>
        )}
        <div className="flex-1 overflow-auto p-2 min-h-[200px]">
          <DirectoryTree
            highlightedPath={selectedPath}
            onHighlight={setSelectedPath}
            onSelect={(path) => {
              onSelect(path);
              onClose();
              setSelectedPath(null);
            }}
          />
        </div>
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-border">
          <button
            type="button"
            className="px-4 py-1.5 text-sm rounded border border-border hover:bg-white/5"
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-1.5 text-sm rounded bg-accent text-white disabled:opacity-40"
            disabled={!selectedPath}
            onClick={handleOpen}
          >
            Open
          </button>
        </div>
      </div>
    </div>
  );
}
