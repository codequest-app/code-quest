import { useState } from 'react';
import { FileTree } from './FileTree';
import { Dialog, DialogClose, DialogContent } from './ui/Dialog';

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

  function handleOpen() {
    if (selectedPath) {
      onSelect(selectedPath);
      onClose();
      setSelectedPath(null);
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setSelectedPath(null);
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        title="Select Project Directory"
        className="w-[480px] max-h-[70vh] flex flex-col"
      >
        {selectedPath && (
          <div className="-mx-4 px-4 py-1.5 text-xs text-text-muted truncate border-b border-border bg-bg/30 mb-2">
            {selectedPath}
          </div>
        )}
        <div className="flex-1 overflow-auto min-h-[200px]">
          <FileTree
            highlightedPath={selectedPath}
            onHighlight={setSelectedPath}
            onSelect={(path) => {
              onSelect(path);
              onClose();
              setSelectedPath(null);
            }}
          />
        </div>
        <div className="flex justify-end gap-2 -mx-4 -mb-4 px-4 py-3 border-t border-border mt-3">
          <DialogClose asChild>
            <button
              type="button"
              className="px-4 py-1.5 text-sm rounded border border-border hover:bg-white/5"
            >
              Cancel
            </button>
          </DialogClose>
          <button
            type="button"
            className="px-4 py-1.5 text-sm rounded bg-accent text-white disabled:opacity-40"
            disabled={!selectedPath}
            onClick={handleOpen}
          >
            Open
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
