import type { RewindResult } from '@code-quest/shared';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useClickOutside } from '../hooks/useClickOutside';
import type { ForkFn, RewindFn } from '../types/ui';
import { RewindPreview } from './RewindPreview';
import { Dialog, DialogContent } from './ui/Dialog';

interface MessageActionsProps {
  messageId: string;
  messageRole: string;
  messageContent?: string;
  onRewind: RewindFn;
  onFork?: ForkFn;
}

type RewindState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'preview'; data: RewindResult }
  | { phase: 'fallback' };

const IDLE: RewindState = { phase: 'idle' };

export function MessageActions({
  messageId,
  messageRole,
  messageContent,
  onRewind,
  onFork,
}: MessageActionsProps) {
  const [rewindState, setRewindState] = useState<RewindState>(IDLE);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useClickOutside([menuRef, btnRef], () => setMenuOpen(false), menuOpen);

  // Animate in
  useEffect(() => {
    if (menuOpen) {
      requestAnimationFrame(() => setMenuVisible(true));
    } else {
      setMenuVisible(false);
    }
  }, [menuOpen]);

  if (messageRole !== 'user') return null;

  const handleRewind = async () => {
    setMenuOpen(false);
    setRewindState({ phase: 'loading' });
    const result = await onRewind(messageId, true);
    if (result.canRewind) {
      setRewindState({ phase: 'preview', data: result });
    } else {
      setRewindState({ phase: 'fallback' });
    }
  };

  const handleConfirmRewind = async () => {
    setRewindState(IDLE);
    await onRewind(messageId, false);
  };

  const handleFork = async () => {
    setMenuOpen(false);
    if (!onFork) return;
    const result = await onFork(messageId);
    if (result.success && result.channelId) {
      toast.success(`Forked to new session: ${result.channelId}`);
    } else {
      toast.error(result.error ?? 'Failed to fork session');
    }
  };

  const handleForkAndRewind = async () => {
    setMenuOpen(false);
    if (!onFork) return;
    const forkResult = await onFork(messageId);
    if (forkResult.success) {
      await onRewind(messageId, false);
      toast.success('Forked and rewound');
    }
  };

  const handleCopy = () => {
    setMenuOpen(false);
    if (messageContent) {
      navigator.clipboard.writeText(messageContent);
      toast.success('Copied to clipboard');
    }
  };

  const handleCancel = () => setRewindState(IDLE);

  return (
    <>
      <div className="relative inline-block">
        <button
          ref={btnRef}
          type="button"
          title="Message actions"
          onClick={() => setMenuOpen((v) => !v)}
          className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-text-muted hover:text-accent transition-opacity cursor-pointer rounded hover:bg-white/5"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
          </svg>
        </button>

        {menuOpen && (
          <div
            ref={menuRef}
            className={`absolute left-0 bottom-full mb-1 bg-surface border border-border rounded-lg shadow-lg z-50 min-w-[200px] py-1 transition-opacity ${menuVisible ? 'opacity-100' : 'opacity-0'}`}
          >
            {messageContent && <PopupOption onClick={handleCopy}>Copy message</PopupOption>}
            {onFork && <PopupOption onClick={handleFork}>Fork conversation from here</PopupOption>}
            <PopupOption onClick={handleRewind} disabled={rewindState.phase === 'loading'}>
              {rewindState.phase === 'loading' ? 'Loading...' : 'Rewind code to here'}
            </PopupOption>
            {onFork && (
              <PopupOption onClick={handleForkAndRewind}>Fork and rewind code</PopupOption>
            )}
          </div>
        )}
      </div>

      {rewindState.phase === 'fallback' && (
        <span className="inline-flex items-center gap-1 text-[11px]">
          <span className="text-warning">No preview available.</span>
          <button
            type="button"
            onClick={handleConfirmRewind}
            className="text-accent hover:underline font-medium"
          >
            Confirm Rewind
          </button>
          <button type="button" onClick={handleCancel} className="text-text-muted hover:text-text">
            Cancel
          </button>
        </span>
      )}

      <Dialog
        open={rewindState.phase === 'preview'}
        onOpenChange={(open) => !open && handleCancel()}
      >
        <DialogContent title="Rewind Preview" className="max-w-md w-full">
          <div className="mb-3">
            <RewindPreview data={rewindState.phase === 'preview' ? rewindState.data : {}} />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="text-xs px-3 py-1.5 rounded border border-border text-text-muted hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmRewind}
              className="text-xs px-3 py-1.5 rounded bg-accent text-white hover:bg-accent/80"
            >
              Confirm Rewind
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PopupOption({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full text-left px-3 py-1.5 text-xs text-text hover:bg-white/5 disabled:opacity-50 cursor-pointer transition-colors"
    >
      {children}
    </button>
  );
}
