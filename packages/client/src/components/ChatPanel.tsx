import type { SessionSummary } from '@code-quest/shared';
import { useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  useChannelCompose,
  useChannelConfig,
  useChannelControl,
  useChannelMessages,
} from '../contexts/channel';
import { useSession } from '../contexts/SessionContext';
import { useTab } from '../contexts/TabContext';
import { ChatInputArea } from './ChatInputArea';
import { ContentPreviewPanel } from './ContentPreviewPanel';
import { ElicitationDialog } from './ElicitationDialog';
import { HeaderBar } from './HeaderBar';
import { MessageList } from './MessageList';
import { OnboardingOverlay } from './OnboardingOverlay';
import { RawEventPanel } from './RawEventPanel';
import { SearchBar } from './SearchBar';
import { SessionDropdown } from './SessionDropdown';
import { WorktreeBanner } from './WorktreeBanner';

const SIDE_PANEL = 'w-72 shrink-0';
const NO_FORM = { enableOnFormTags: false, preventDefault: true } as const;

export function ChatPanel({ title }: { title?: string }) {
  const { channelId, subscribeRawEvents } = useChannelMessages();
  const { worktree } = useChannelConfig();
  const { focusTextarea } = useChannelCompose();
  const { listSessions, renameSession, deleteSession, resumeSession } = useSession();
  const { createNewTab } = useTab();
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
  const [showResumeOverlay, setShowResumeOverlay] = useState(false);
  const [resumeSessions, setResumeSessions] = useState<{
    sessions: SessionSummary[];
    total: number;
  }>({ sessions: [], total: 0 });
  const [resumeLoading, setResumeLoading] = useState(false);

  const searchBarRef = useRef<HTMLInputElement>(null);

  const openResumeOverlay = () => {
    setShowResumeOverlay(true);
    setResumeLoading(true);
    listSessions({ limit: 50 })
      .then(setResumeSessions)
      .finally(() => setResumeLoading(false));
  };

  const handleResumeSelect = (sessionId: string) => {
    resumeSession(sessionId);
    setShowResumeOverlay(false);
  };

  useHotkeys('/', () => focusTextarea(), NO_FORM);
  useHotkeys('mod+k', () => searchBarRef.current?.focus(), NO_FORM);

  if (!channelId) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
        No active session — click + to create a new tab
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      <OnboardingOverlay />
      {pendingDiffReview && (
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
      )}
      <div className="flex flex-col flex-1 min-w-0 relative">
        <HeaderBar
          title={title}
          onToggleRaw={() => setActiveSidePanel((v) => (v === 'raw' ? null : 'raw'))}
        />
        {worktree && (
          <WorktreeBanner
            worktree={worktree}
            onOpenInNewTab={(path) => createNewTab(undefined, { cwd: path })}
          />
        )}
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          inputRef={searchBarRef}
        />
        <MessageList searchQuery={searchQuery} typeFilter={typeFilter} />
        {showResumeOverlay && (
          <SessionDropdown
            sessions={resumeSessions.sessions}
            loading={resumeLoading}
            onSelect={handleResumeSelect}
            onClose={() => setShowResumeOverlay(false)}
            onRename={renameSession}
            onDelete={deleteSession}
          />
        )}
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <div className="max-w-[680px] mx-auto w-full flex flex-col gap-3">
            <ChatInputArea onResumeConversation={openResumeOverlay} />
          </div>
        </div>
      </div>
      {activeSidePanel === 'raw' && (
        <div className={SIDE_PANEL}>
          <RawEventPanel
            onSubscribe={subscribeRawEvents}
            onClose={() => setActiveSidePanel(null)}
          />
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
