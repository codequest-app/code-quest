import type { RewindResult } from '@code-quest/shared';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useClickOutside } from '../hooks/useClickOutside';
import type { ForkFn, RewindFn } from '../types/ui';
import { copyToClipboard } from '../utils/clipboard';
import { cn } from '../utils/cn';
import { RewindPreview } from './RewindPreview';
import { Button } from './ui/Button';
import { Dialog, DialogContent } from './ui/Dialog';
import { ReplyIcon } from './ui/Icons';

interface MessageActionsProps {
  /** CLI/JSONL uuid; required for fork & rewind RPCs that go through the CLI. */
  cliUuid?: string;
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
  cliUuid,
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
    if (!cliUuid) return;
    const result = await onRewind(cliUuid, true);
    if (result.ok && result.data.canRewind) {
      setRewindState({ phase: 'preview', data: result.data });
    } else {
      setRewindState({ phase: 'fallback' });
    }
  };

  const handleConfirmRewind = async () => {
    setRewindState(IDLE);
    if (!cliUuid) return;
    await onRewind(cliUuid, false);
  };

  const handleFork = async () => {
    setMenuOpen(false);
    if (!onFork || !cliUuid) return;
    const result = await onFork(cliUuid);
    if (result.ok) {
      toast.success(`Forked to new session: ${result.data.channelId}`);
    } else {
      toast.error(result.error ?? 'Failed to fork session');
    }
  };

  const handleForkAndRewind = async () => {
    setMenuOpen(false);
    if (!onFork || !cliUuid) return;
    const forkResult = await onFork(cliUuid);
    if (forkResult.ok) {
      await onRewind(cliUuid, false);
      toast.success('Forked and rewound');
    }
  };

  const handleCopy = () => {
    setMenuOpen(false);
    if (messageContent) {
      copyToClipboard(messageContent);
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
          <ReplyIcon className="w-3.5 h-3.5" />
        </button>

        {menuOpen && (
          <div
            ref={menuRef}
            className={cn(
              'absolute left-0 bottom-full mb-1 bg-surface border border-border rounded-lg shadow-lg z-modal min-w-50 py-1 transition-opacity',
              menuVisible ? 'opacity-100' : 'opacity-0',
            )}
          >
            {messageContent && <PopupOption onClick={handleCopy}>Copy message</PopupOption>}
            {onFork && cliUuid && (
              <PopupOption onClick={handleFork}>Fork conversation from here</PopupOption>
            )}
            <PopupOption
              onClick={handleRewind}
              disabled={rewindState.phase === 'loading' || !cliUuid}
            >
              {rewindState.phase === 'loading' ? 'Loading...' : 'Rewind code to here'}
            </PopupOption>
            {onFork && cliUuid && (
              <PopupOption onClick={handleForkAndRewind}>Fork and rewind code</PopupOption>
            )}
          </div>
        )}
      </div>

      {rewindState.phase === 'fallback' && (
        <span className="inline-flex items-center gap-1 text-xs">
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
            <Button variant="secondary" size="xs" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="xs" onClick={handleConfirmRewind}>
              Confirm Rewind
            </Button>
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
