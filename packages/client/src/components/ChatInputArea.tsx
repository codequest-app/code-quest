import { toPermissionMode } from '@code-quest/shared';
import { useRef } from 'react';
import {
  useChannelComposeActions,
  useChannelConfig,
  useChannelMessages,
} from '../contexts/channel';
import { cn } from '../utils/cn';
import { ComposeInput } from './ComposeInput';
import { ComposeToolbar } from './ComposeToolbar';
import { type ModifiedFile, ModifiedFilesPanel } from './ModifiedFilesPanel';
import { PendingActionButtons } from './PendingActionButtons';
import { ReviewUpsellBanner } from './ReviewUpsellBanner';
import { SpeechInputContainer } from './SpeechInputContainer';

export function ChatInputArea(): React.JSX.Element {
  const { permissionMode } = useChannelConfig();
  const { focusTextarea, addAttachments, insertSlashCommand } = useChannelComposeActions();
  const { modifiedFiles, removeModifiedFile } = useChannelMessages();

  const modifiedFileEntries = Object.entries(modifiedFiles);
  const modifiedFileList: ModifiedFile[] = modifiedFileEntries.map(([path, entry]) => ({
    path,
    status: !entry.oldContent ? 'added' : !entry.newContent ? 'deleted' : 'modified',
    oldContent: entry.oldContent ?? undefined,
    newContent: entry.newContent ?? undefined,
  }));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const openFilePicker = () => fileInputRef.current?.click();

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length > 0) addAttachments(files);
          e.target.value = '';
        }}
      />
      <PendingActionButtons />
      <ReviewUpsellBanner />
      <div
        ref={containerRef}
        data-mode={toPermissionMode(permissionMode)}
        className={cn(
          'rounded-xl bg-surface border border-border transition-all relative shadow-sm',
          'focus-within:border-[var(--mode-accent)]',
          'focus-within:shadow-[0_1px_2px_rgba(var(--mode-accent-rgb),var(--mode-shadow-alpha,0))]',
        )}
        onClick={focusTextarea}
        role="none"
      >
        <ComposeInput containerRef={containerRef} />
        <SpeechInputContainer
          onFinal={insertSlashCommand}
          className="absolute top-2 right-2 z-10"
        />
        <ComposeToolbar containerRef={containerRef} onAttachFile={openFilePicker} />
      </div>
      {modifiedFileEntries.length > 0 && (
        <ModifiedFilesPanel files={modifiedFileList} onAccept={removeModifiedFile} />
      )}
    </>
  );
}
