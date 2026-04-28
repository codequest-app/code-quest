import { useState } from 'react';
import { toast } from 'sonner';
import { RewindBody } from '../features/rewind/RewindBody';
import { RewindConfirmDialog } from '../features/rewind/RewindConfirmDialog';
import type { ForkFn, RewindFn } from '../types/ui';
import { copyToClipboard } from '../utils/clipboard';
import { MessageActionsMenu } from './MessageActionsMenu';

interface MessageActionsProps {
  /** CLI/JSONL uuid; required for fork & rewind RPCs that go through the CLI. */
  cliUuid?: string;
  messageRole: string;
  messageContent?: string;
  onRewind: RewindFn;
  onFork?: ForkFn;
}

export function MessageActions({
  cliUuid,
  messageRole,
  messageContent,
  onRewind,
  onFork,
}: MessageActionsProps): React.ReactNode {
  const [dialog, setDialog] = useState<'rewind' | 'fork-and-rewind' | null>(null);
  const closeDialog = () => setDialog(null);

  if (messageRole !== 'user') return null;

  const handleCopy = () => {
    if (!messageContent) return;
    copyToClipboard(messageContent);
    toast.success('Copied to clipboard');
  };

  const handleFork = async () => {
    if (!onFork || !cliUuid) return;
    const result = await onFork(cliUuid);
    if (result.ok) {
      toast.success(`Forked to new session: ${result.data.channelId}`);
    } else {
      toast.error(result.error ?? 'Failed to fork session');
    }
  };

  const handleConfirmRewind = async () => {
    closeDialog();
    if (!cliUuid) return;
    await onRewind(cliUuid);
  };

  const handleConfirmForkAndRewind = async () => {
    closeDialog();
    if (!onFork || !cliUuid) return;
    const forkResult = await onFork(cliUuid);
    if (forkResult.ok) {
      await onRewind(cliUuid);
      toast.success('Forked and rewound');
    } else {
      toast.error(forkResult.error ?? 'Failed to fork session');
    }
  };

  return (
    <>
      <MessageActionsMenu
        items={[
          messageContent && { label: 'Copy message', onSelect: handleCopy },
          onFork && cliUuid && { label: 'Fork conversation from here', onSelect: handleFork },
          { label: 'Rewind code to here', onSelect: () => setDialog('rewind'), disabled: !cliUuid },
          onFork &&
            cliUuid && {
              label: 'Fork and rewind code',
              onSelect: () => setDialog('fork-and-rewind'),
            },
        ]}
      />

      <RewindConfirmDialog
        open={dialog === 'rewind'}
        title="Rewind code"
        onConfirm={handleConfirmRewind}
        onCancel={closeDialog}
      >
        <RewindBody />
      </RewindConfirmDialog>

      <RewindConfirmDialog
        open={dialog === 'fork-and-rewind'}
        title="Fork and rewind"
        onConfirm={handleConfirmForkAndRewind}
        onCancel={closeDialog}
      >
        <RewindBody forked />
      </RewindConfirmDialog>
    </>
  );
}
