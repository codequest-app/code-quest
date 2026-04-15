import type { RewindResult } from '@code-quest/shared';
import { useEffect, useRef, useState } from 'react';
import { useChannelMessages } from '../contexts/channel';
import type { Message } from '../types/ui';
import { formatRelativeDate } from '../utils/format-relative-date';
import { pluralize } from '../utils/pluralize';
import { Dialog, DialogContent } from './ui/Dialog';

interface RewindItem {
  message: Message;
  promptText: string;
}

function getRewindableMessages(messages: Message[]): RewindItem[] {
  const items: RewindItem[] = [];
  for (const msg of messages) {
    if (msg.type !== 'text' || msg.role !== 'user' || msg.parentToolUseId) continue;
    if (!msg.cliUuid) continue;
    const text = msg.content.trim();
    if (!text) continue;
    items.push({ message: msg, promptText: text });
  }
  return items.reverse();
}

interface RewindOptionProps {
  item: RewindItem;
  index: number;
  focusIndex: number;
  now: Date;
  onSelect: (item: RewindItem) => void;
  onFocus: (index: number) => void;
}

function RewindOption({ item, index, focusIndex, now, onSelect, onFocus }: RewindOptionProps) {
  return (
    <button
      type="button"
      key={item.message.id}
      role="option"
      aria-selected={index === focusIndex}
      onClick={() => onSelect(item)}
      onMouseEnter={() => onFocus(index)}
      className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer text-sm text-left ${
        index === focusIndex ? 'bg-selected text-white' : 'text-text hover:bg-white/5'
      }`}
    >
      <span className="truncate mr-3">{item.promptText}</span>
      <span className="text-xs text-text-muted whitespace-nowrap">
        {formatRelativeDate(new Date(item.message.timestamp), now)}
      </span>
    </button>
  );
}

interface RewindDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (item: { messageId: string; promptText: string }) => void;
}

export function RewindDialog({ open, onClose, onConfirm }: RewindDialogProps) {
  const { messages, rewindToMessage } = useChannelMessages();
  const items = getRewindableMessages(messages);
  const [focusIndex, setFocusIndex] = useState(0);
  const [selected, setSelected] = useState<RewindItem | null>(null);
  const [rewindCheck, setRewindCheck] = useState<RewindResult | null>(null);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setFocusIndex(0);
      setSelected(null);
      setRewindCheck(null);
      setTimeout(() => listRef.current?.focus(), 0);
    }
  }, [open]);

  const handleSelect = (item: RewindItem) => {
    setSelected(item);
    setLoading(true);
    setRewindCheck(null);
    rewindToMessage(item.message.id, true)
      .then((result) => {
        if (result.ok) {
          setRewindCheck(result.data);
        } else {
          setRewindCheck({ canRewind: false, error: result.error });
        }
      })
      .catch((err) => {
        setRewindCheck({
          canRewind: false,
          error: err instanceof Error ? err.message : String(err),
        });
      })
      .finally(() => setLoading(false));
  };

  const handleConfirm = () => {
    if (!selected || !selected.message.cliUuid) return;
    onConfirm({ messageId: selected.message.cliUuid, promptText: selected.promptText });
  };

  const handleBack = () => {
    setSelected(null);
    setRewindCheck(null);
  };

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
      if (item) handleSelect(item);
    }
  };

  if (selected) {
    const hasChanges = rewindCheck?.filesChanged && rewindCheck.filesChanged.length > 0;
    const canConfirm = rewindCheck?.canRewind && !loading;

    return (
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent title="Fork and rewind" className="w-[520px] max-w-[90vw]">
          <p className="text-sm text-text-muted mb-2">
            A new forked conversation will be created after rewinding.
          </p>

          {loading && <p className="text-sm text-text-muted py-2">Checking code changes…</p>}

          {!loading && rewindCheck?.error && (
            <p className="text-sm text-danger py-2">{rewindCheck.error}</p>
          )}
          {!loading && rewindCheck && !rewindCheck.canRewind && !rewindCheck.error && (
            <p className="text-sm text-text-muted py-2">Cannot rewind from this message.</p>
          )}

          {!loading && rewindCheck?.canRewind && (
            <>
              {hasChanges ? (
                <>
                  <p className="text-sm mb-2">
                    <span className="text-danger">
                      {pluralize(rewindCheck.deletions ?? 0, 'line')}
                    </span>{' '}
                    will be removed and{' '}
                    <span className="text-success">
                      {pluralize(rewindCheck.insertions ?? 0, 'line')}
                    </span>{' '}
                    will be added across {pluralize(rewindCheck.filesChanged?.length ?? 0, 'file')}:
                  </p>
                  <ul className="text-xs text-text-muted font-mono mb-2 max-h-[150px] overflow-y-auto">
                    {rewindCheck.filesChanged?.map((f) => (
                      <li key={f} className="py-0.5">
                        {f}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-sm mb-2">
                  The code <strong>has not changed</strong>, so no code will be restored.
                </p>
              )}
              <p className="text-xs text-text-muted mb-3 flex items-center gap-1">
                <span>ⓘ</span> Rewinding does not affect files edited manually or via bash.
              </p>
            </>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              disabled={!canConfirm}
              onClick={handleConfirm}
              className="flex-1 px-3 py-1.5 rounded text-sm font-medium bg-accent text-white hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span aria-hidden="true">1</span> Continue
            </button>
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 px-3 py-1.5 rounded text-sm text-text hover:bg-white/10"
            >
              <span aria-hidden="true">2</span> Never mind
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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
                <RewindOption
                  key={item.message.id}
                  item={item}
                  index={i}
                  focusIndex={focusIndex}
                  now={now}
                  onSelect={handleSelect}
                  onFocus={setFocusIndex}
                />
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
