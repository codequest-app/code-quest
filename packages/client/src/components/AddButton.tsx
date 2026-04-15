import { useEffect, useRef, useState } from 'react';
import { useClickOutside } from '../hooks/useClickOutside';

function UploadIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M8 1.5a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 7.793V2a.5.5 0 0 1 .5-.5zM2.5 10a.5.5 0 0 1 .5.5V13h10v-2.5a.5.5 0 0 1 1 0V13.5a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5V10.5a.5.5 0 0 1 .5-.5z"
        fill="currentColor"
        transform="rotate(180 8 8)"
      />
    </svg>
  );
}

function AddContextIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A.5.5 0 0 0 8.914 4H13.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
      <text
        x="8"
        y="10.5"
        textAnchor="middle"
        fontSize="7"
        fill="currentColor"
        fontFamily="monospace"
      >
        @
      </text>
    </svg>
  );
}

export function AddButton({
  onAttachFile,
  onMentionFile,
}: {
  onAttachFile?: () => void;
  onMentionFile?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside([containerRef], () => setOpen(false), open);

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: handleKeyDown uses stable setOpen
  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  if (!onAttachFile && !onMentionFile) return null;

  const items: Array<{
    id: string;
    label: string;
    title: string;
    icon: React.ReactNode;
    onClick: () => void;
  }> = [];

  if (onAttachFile)
    items.push({
      id: 'upload',
      label: 'Upload from computer',
      title: 'Attach files from your computer',
      icon: <UploadIcon />,
      onClick: () => {
        onAttachFile();
        setOpen(false);
      },
    });

  if (onMentionFile)
    items.push({
      id: 'files',
      label: 'Add context',
      title: 'Add files or folders to the conversation',
      icon: <AddContextIcon />,
      onClick: () => {
        onMentionFile();
        setOpen(false);
      },
    });

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        title="Add"
        onClick={() => setOpen((v) => !v)}
        className="w-[26px] h-[26px] flex items-center justify-center rounded text-text-bright hover:bg-white/5 transition-colors shrink-0"
      >
        <svg
          width="24"
          height="24"
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
        <div className="absolute bottom-full left-0 mb-1 bg-surface border border-border rounded-lg shadow-lg overflow-hidden z-50 min-w-[200px]">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              title={item.title}
              onClick={item.onClick}
              className="w-full text-left px-3 py-2 text-xs text-text hover:bg-white/5 flex items-center gap-2"
            >
              <span className="w-4 h-4 flex items-center justify-center text-text-muted opacity-70">
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
