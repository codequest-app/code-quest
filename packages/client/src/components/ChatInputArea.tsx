import { useRef } from 'react';
import { useChannelCompose, useChannelConfig, useChannelMessages } from '../contexts/channel';
import { ComposeInput } from './ComposeInput';
import { ComposeToolbar } from './ComposeToolbar';
import { type ModifiedFile, ModifiedFilesPanel } from './ModifiedFilesPanel';
import { PendingActionButtons } from './PendingActionButtons';
import { ReviewUpsellBanner } from './ReviewUpsellBanner';

export function ChatInputArea() {
  const { permissionMode, isFastMode } = useChannelConfig();
  const { focusTextarea, addAttachments } = useChannelCompose();
  const { modifiedFiles, removeModifiedFile } = useChannelMessages();

  const modifiedFileEntries = Object.entries(modifiedFiles);
  const modifiedFileList: ModifiedFile[] = modifiedFileEntries.map(([path, entry]) => ({
    path,
    status: !entry.oldContent ? 'added' : !entry.newContent ? 'deleted' : 'modified',
    oldContent: entry.oldContent ?? undefined,
    newContent: entry.newContent ?? undefined,
  }));
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        data-permission-mode={permissionMode ?? 'normal'}
        data-spark={isFastMode ? 'on' : undefined}
        className="rounded-xl bg-chat-input-bg border border-chat-input-border transition-all relative shadow-sm"
        onClick={focusTextarea}
        role="none"
      >
        <ComposeInput />
        <ComposeToolbar onAttachFile={openFilePicker} />
      </div>
      {modifiedFileEntries.length > 0 && (
        <ModifiedFilesPanel files={modifiedFileList} onAccept={removeModifiedFile} />
      )}
    </>
  );
}
