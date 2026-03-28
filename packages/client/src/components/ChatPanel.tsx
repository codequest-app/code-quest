import { useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useChannelCompose, useChannelControl, useChannelMessages } from '../contexts/channel';
import { ChatInputArea } from './ChatInputArea';
import { ContentPreviewPanel } from './ContentPreviewPanel';
import { ElicitationDialog } from './ElicitationDialog';
import { HeaderBar } from './HeaderBar';
import { MessageList } from './MessageList';
import { OnboardingOverlay } from './OnboardingOverlay';
import { RawEventPanel } from './RawEventPanel';
import { SearchBar } from './SearchBar';
import { SessionListPage } from './SessionListPage';

const SIDE_PANEL = 'w-72 shrink-0';
const NO_FORM = { enableOnFormTags: false, preventDefault: true } as const;

export function ChatPanel({
  title,
  joinSession,
  toggleHistory,
}: {
  title?: string;
  joinSession: (id: string) => void;
  toggleHistory: () => void;
}) {
  const { channelId, fetchRawEvents } = useChannelMessages();
  const { focusTextarea } = useChannelCompose();
  const {
    pendingDiffReview,
    diffRespond,
    clearPendingDiffReview,
    pendingElicitation,
    respondToElicitation,
    cancelElicitation,
  } = useChannelControl();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [activeSidePanel, setActiveSidePanel] = useState<'raw' | null>(null);

  const searchBarRef = useRef<HTMLInputElement>(null);

  const [isSessionsMode] = useState(
    () => new URLSearchParams(window.location.search).get('mode') === 'sessions',
  );

  useHotkeys('/', () => focusTextarea(), NO_FORM);
  useHotkeys('mod+k', () => searchBarRef.current?.focus(), NO_FORM);

  if (!channelId) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
        No active session — click + to create a new tab
      </div>
    );
  }

  if (isSessionsMode) {
    return (
      <SessionListPage
        onSelect={(id) => {
          window.location.search = `?session=${id}`;
        }}
        onJoin={(id) => {
          joinSession(id);
          window.location.search = '';
        }}
      />
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      <OnboardingOverlay />
      {pendingDiffReview && (
        <div className={SIDE_PANEL}>
          <ContentPreviewPanel
            content=""
            title={pendingDiffReview.filePath ?? 'Diff'}
            diffs={[
              {
                filePath: pendingDiffReview.filePath,
                oldContent: pendingDiffReview.oldContent,
                newContent: pendingDiffReview.newContent,
              },
            ]}
            pendingDiffToolId={pendingDiffReview.toolId}
            onDiffRespond={(toolId, accepted) => {
              diffRespond(toolId, accepted);
              clearPendingDiffReview();
            }}
            onClose={() => clearPendingDiffReview()}
          />
        </div>
      )}
      <div className="flex flex-col flex-1 min-w-0 relative">
        <HeaderBar
          title={title}
          onToggleRaw={() => setActiveSidePanel((v) => (v === 'raw' ? null : 'raw'))}
        />
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          inputRef={searchBarRef}
        />
        <MessageList searchQuery={searchQuery} typeFilter={typeFilter} />
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <div className="max-w-[680px] mx-auto w-full flex flex-col gap-3">
            <ChatInputArea toggleHistory={toggleHistory} />
          </div>
        </div>
      </div>
      {activeSidePanel === 'raw' && (
        <div className={SIDE_PANEL}>
          <RawEventPanel onFetch={fetchRawEvents} onClose={() => setActiveSidePanel(null)} />
        </div>
      )}
      {pendingElicitation && (
        <ElicitationDialog
          requestId={pendingElicitation.requestId}
          prompt={pendingElicitation.prompt}
          inputType={pendingElicitation.inputType}
          options={pendingElicitation.options}
          url={pendingElicitation.url}
          onSubmit={respondToElicitation}
          onCancel={cancelElicitation}
        />
      )}
    </div>
  );
}
