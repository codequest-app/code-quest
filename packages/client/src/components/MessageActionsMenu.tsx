import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePopover } from '../hooks/usePopover';

export interface MessageActionItem {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
}

interface MessageActionsMenuProps {
  items: ReadonlyArray<MessageActionItem | false | '' | null | undefined>;
}

export function MessageActionsMenu({ items }: MessageActionsMenuProps) {
  const { open, setOpen, triggerRef: btnRef, panelRef: menuRef } = usePopover();
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    // Close on scroll/resize so the menu doesn't drift from the trigger.
    const close = () => setOpen(false);
    window.addEventListener('scroll', close, { capture: true, passive: true });
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, { capture: true });
      window.removeEventListener('resize', close);
    };
  }, [open, setOpen, btnRef]);

  const visible = items.filter((i): i is MessageActionItem => Boolean(i));

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        title="Message actions"
        onClick={() => setOpen((v) => !v)}
        className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-full border border-border text-text-muted hover:text-text hover:bg-white/5 transition-opacity cursor-pointer"
      >
        <ArrowUturnLeftIcon className="w-3.5 h-3.5" />
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: 'fixed', top: pos.top, right: pos.right }}
            className="flex flex-col bg-surface border border-border rounded-lg shadow-lg z-popover min-w-50 py-1"
          >
            {visible.map((item) => (
              <button
                key={item.label}
                type="button"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-text hover:bg-white/5 disabled:opacity-50 cursor-pointer transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
