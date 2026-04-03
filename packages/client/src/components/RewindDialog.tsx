import type { RewindResult } from '@code-quest/shared';
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
  onConfirm: (item: { messageId: string; promptText: string }) => void;
}

export function RewindDialog({ open, onClose, onConfirm }: RewindDialogProps) {
  const { messages, rewindToMessage } = useChannelMessages();
  const items = getRewindableMessages(messages);
  const [focusIndex, setFocusIndex] = useState(0);
  const [selected, setSelected] = useState<RewindItem | null>(null);
  const [dryRunResult, setRewindResult] = useState<RewindResult | null>(null);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setFocusIndex(0);
      setSelected(null);
      setRewindResult(null);
      setTimeout(() => listRef.current?.focus(), 0);
    }
  }, [open]);

  const handleSelect = (item: RewindItem) => {
    setSelected(item);
    setLoading(true);
    setRewindResult(null);
    rewindToMessage(item.message.id, true)
      .then((result) => {
        setRewindResult(result);
      })
      .catch((err) => {
        setRewindResult({
          canRewind: false,
          error: err instanceof Error ? err.message : String(err),
        });
      })
      .finally(() => setLoading(false));
  };

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm({ messageId: selected.message.id, promptText: selected.promptText });
  };

  const handleBack = () => {
    setSelected(null);
    setRewindResult(null);
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

  const now = new Date();

  // Phase 2: Confirmation
  if (selected) {
    const hasChanges = dryRunResult?.filesChanged && dryRunResult.filesChanged.length > 0;
    const canConfirm = dryRunResult?.canRewind && !loading;

    return (
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent title="Fork and rewind" className="w-[520px] max-w-[90vw]">
          <p className="text-sm text-text-muted mb-2">
            A new forked conversation will be created after rewinding.
          </p>

          {loading && <p className="text-sm text-text-muted py-2">Checking code changes…</p>}

          {!loading && dryRunResult?.error && (
            <p className="text-sm text-danger py-2">{dryRunResult.error}</p>
          )}

          {!loading && dryRunResult?.canRewind && (
            <>
              {hasChanges ? (
                <>
                  <p className="text-sm mb-2">
                    <span className="text-danger">
                      {dryRunResult.deletions ?? 0} line{dryRunResult.deletions !== 1 ? 's' : ''}
                    </span>{' '}
                    will be removed and{' '}
                    <span className="text-success">
                      {dryRunResult.insertions ?? 0} line{dryRunResult.insertions !== 1 ? 's' : ''}
                    </span>{' '}
                    will be added across {dryRunResult.filesChanged?.length ?? 0} file
                    {(dryRunResult.filesChanged?.length ?? 0) !== 1 ? 's' : ''}:
                  </p>
                  <ul className="text-xs text-text-muted font-mono mb-2 max-h-[150px] overflow-y-auto">
                    {dryRunResult.filesChanged?.map((f) => (
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
              1 Continue
            </button>
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 px-3 py-1.5 rounded text-sm text-text hover:bg-white/10"
            >
              2 Never mind
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Phase 1: Message picker
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
                  onClick={() => handleSelect(item)}
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
