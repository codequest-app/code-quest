import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { usePopover } from '../hooks/usePopover';
import { AddContextIcon } from './icons/MentionIcons';
import { IconButton } from './ui/IconButton';
import { PlusIcon } from './ui/Icons';

export function AddButton({
  onAttachFile,
  onMentionFile,
}: {
  onAttachFile?: () => void;
  onMentionFile?: () => void;
}) {
  const { open, setOpen, triggerRef, panelRef } = usePopover<HTMLDivElement, HTMLDivElement>();

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
      icon: <ArrowUpTrayIcon className="w-4 h-4" />,
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
      icon: <AddContextIcon className="w-4 h-4" />,
      onClick: () => {
        onMentionFile();
        setOpen(false);
      },
    });

  return (
    <div ref={triggerRef} className="relative">
      <IconButton title="Add" onClick={() => setOpen((v) => !v)} className="shrink-0">
        <PlusIcon className="w-5 h-5" />
      </IconButton>
      {open && (
        <div
          ref={panelRef}
          className="absolute bottom-full left-0 mb-1 bg-surface border border-border rounded-lg shadow-lg overflow-hidden z-modal min-w-50"
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              title={item.title}
              onClick={item.onClick}
              className="w-full text-left px-3 py-2 text-xs text-text hover:tint-5 flex items-center gap-2"
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
