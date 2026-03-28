import { useRef, useState } from 'react';

export function AddButton({
  onAttachFile,
  onMentionFile,
}: {
  onAttachFile?: () => void;
  onMentionFile?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (
      containerRef.current &&
      !containerRef.current.contains(e.target as Node) &&
      buttonRef.current &&
      !buttonRef.current.contains(e.target as Node)
    ) {
      setOpen(false);
    }
  };

  if (!onAttachFile && !onMentionFile) return null;

  const items: Array<{ id: string; label: string; title: string; onClick: () => void }> = [];
  if (onAttachFile)
    items.push({
      id: 'upload',
      label: 'Upload from computer',
      title: 'Attach files from your computer',
      onClick: () => {
        onAttachFile();
        setOpen(false);
      },
    });
  if (onMentionFile)
    items.push({
      id: 'files',
      label: 'Files & Folders',
      title: 'Add files or folders to the conversation',
      onClick: () => {
        onMentionFile();
        setOpen(false);
      },
    });

  return (
    <div className="relative" onMouseDown={handleMouseDown} onKeyDown={undefined} role="none">
      <button
        ref={buttonRef}
        type="button"
        title="Add"
        onClick={() => setOpen((v) => !v)}
        className="w-[26px] h-[26px] flex items-center justify-center rounded text-text-muted hover:text-text hover:bg-white/5 transition-colors shrink-0"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M10 5C10.2761 5 10.5 5.22386 10.5 5.5V9.5H14.5C14.7761 9.5 15 9.72386 15 10C15 10.2417 14.8286 10.4437 14.6006 10.4902L14.5 10.5H10.5V14.5C10.5 14.7761 10.2761 15 10 15C9.72386 15 9.5 14.7761 9.5 14.5V10.5H5.5L5.39941 10.4902C5.17145 10.4437 5 10.2417 5 10C5 9.75829 5.17145 9.55629 5.39941 9.50977L5.5 9.5H9.5V5.5C9.5 5.22386 9.72386 5 10 5Z"
            fill="currentColor"
          />
        </svg>
      </button>
      {open && (
        <div
          ref={containerRef}
          className="absolute bottom-full right-0 mb-1 bg-surface border border-border rounded-lg shadow-lg overflow-hidden z-50 min-w-[180px]"
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              title={item.title}
              onClick={item.onClick}
              className="w-full text-left px-3 py-2 text-xs text-text hover:bg-white/5 flex items-center gap-2"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
