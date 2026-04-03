import { useEffect, useRef, useState } from 'react';
import { useChannelMessages } from '../contexts/channel';
import type { Message } from '../types/ui';
import { formatRelativeDate } from '../utils/format-relative-date';
import { Dialog, DialogContent } from './ui/Dialog';

interface RewindItem {
  message: Message;
  promptText: string;
}

function getRewindableMessages(messages: Message[]): RewindItem[] {
  const items: RewindItem[] = [];
  for (const msg of messages) {
    if (msg.type !== 'text' || msg.role !== 'user' || msg.parentToolUseId) continue;
    const text = msg.content.trim();
    if (!text) continue;
    items.push({ message: msg, promptText: text });
  }
  return items.reverse();
}

interface RewindDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (item: { messageId: string; promptText: string }) => void;
}

export function RewindDialog({ open, onClose, onSelect }: RewindDialogProps) {
  const { messages } = useChannelMessages();
  const items = getRewindableMessages(messages);
  const [focusIndex, setFocusIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setFocusIndex(0);
      setTimeout(() => listRef.current?.focus(), 0);
    }
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onClose();
      return;
    }
    if (items.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = items[focusIndex];
      if (item) onSelect({ messageId: item.message.id, promptText: item.promptText });
    }
  };

  const now = new Date();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent title="Rewind to…" className="w-[520px] max-w-[90vw]">
        {items.length === 0 ? (
          <p className="text-sm text-text-muted py-4 text-center">No messages to rewind to yet.</p>
        ) : (
          <>
            <p className="text-sm text-text-muted mb-3">
              Select a message to restore code and fork the conversation from that point.
            </p>
            <div
              ref={listRef}
              role="listbox"
              aria-label="Messages to rewind to"
              tabIndex={0}
              onKeyDown={handleKeyDown}
              className="flex flex-col gap-0.5 outline-none max-h-[300px] overflow-y-auto"
            >
              {items.map((item, i) => (
                <button
                  type="button"
                  key={item.message.id}
                  role="option"
                  aria-selected={i === focusIndex}
                  onClick={() =>
                    onSelect({ messageId: item.message.id, promptText: item.promptText })
                  }
                  onMouseEnter={() => setFocusIndex(i)}
                  className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer text-sm text-left ${
                    i === focusIndex ? 'bg-selected text-white' : 'text-text hover:bg-white/5'
                  }`}
                >
                  <span className="truncate mr-3">{item.promptText}</span>
                  <span className="text-xs text-text-muted whitespace-nowrap">
                    {formatRelativeDate(new Date(item.message.timestamp), now)}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-3">
              <kbd className="px-1 py-0.5 bg-surface-hover rounded text-[10px]">↑</kbd>{' '}
              <kbd className="px-1 py-0.5 bg-surface-hover rounded text-[10px]">↓</kbd> to navigate
              · <kbd className="px-1 py-0.5 bg-surface-hover rounded text-[10px]">Enter</kbd> to
              select · <kbd className="px-1 py-0.5 bg-surface-hover rounded text-[10px]">Esc</kbd>{' '}
              to close
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
