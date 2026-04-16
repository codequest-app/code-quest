import type { SessionSummary } from '@code-quest/shared';
import { useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { toast } from 'sonner';
import {
  useChannelCompose,
  useChannelConfig,
  useChannelControl,
  useChannelId,
  useChannelMessages,
} from '../contexts/channel';
import { useProjectActions, useProjectState } from '../contexts/ProjectContext';
import { useSession } from '../contexts/SessionContext';
import { useTabActions } from '../contexts/TabContext';
import { ChatInputArea } from './ChatInputArea';
import { CommandPalette } from './CommandPalette';
import { ContentPreviewPanel } from './ContentPreviewPanel';
import { ElicitationDialog } from './ElicitationDialog';
import { HeaderBar } from './HeaderBar';
import { MessageList, type MessageListHandle } from './MessageList';
import { OnboardingOverlay } from './OnboardingOverlay';
import { RawEventPanel } from './RawEventPanel';
import { resumeRoute } from './resume-route';
import { SessionDropdown } from './SessionDropdown';
import { SideQuestionDialog } from './SideQuestionDialog';
import { WorktreeBanner } from './WorktreeBanner';

const SIDE_PANEL = 'w-72 shrink-0';
const NO_FORM = { enableOnFormTags: false, preventDefault: true } as const;

export function ChatPanel({ title }: { title?: string }) {
  const channelId = useChannelId();
  const { messages, subscribeRawEvents, askSideQuestion } = useChannelMessages();
  const { worktree } = useChannelConfig();
  const { focusTextarea } = useChannelCompose();
  const { listSessions, renameSession, deleteSession, resume } = useSession();
  const { setActiveProject, requestActivateChannel } = useProjectActions();
  const { activeProjectCwd } = useProjectState();
  const { replaceTab } = useTabActions();
  const {
    pendingDiffReview,
    diffRespond,
    clearPendingDiffReview,
    pendingElicitation,
    respondToElicitation,
    cancelElicitation,
  } = useChannelControl();

  const [sideQuestion, setSideQuestion] = useState<{
    open: boolean;
    question: string;
    answer: string | null;
    loading: boolean;
    error: string | null;
  }>({ open: false, question: '', answer: null, loading: false, error: null });

  const handleAskSideQuestion = (question: string) => {
    setSideQuestion({ open: true, question, answer: null, loading: true, error: null });
    askSideQuestion(question)
      .then((result) => {
        if (result.ok) {
          setSideQuestion((prev) => ({ ...prev, loading: false, answer: result.data.answer }));
        } else {
          setSideQuestion((prev) => ({ ...prev, loading: false, error: result.error }));
        }
      })
      .catch((e) => {
        setSideQuestion((prev) => ({
          ...prev,
          loading: false,
          error: e instanceof Error ? e.message : String(e),
        }));
      });
  };

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const [activeSidePanel, setActiveSidePanel] = useState<'raw' | null>(null);
  const [showResumeOverlay, setShowResumeOverlay] = useState(false);
  const [resumeSessions, setResumeSessions] = useState<{
    sessions: SessionSummary[];
    total: number;
  }>({ sessions: [], total: 0 });
  const [resumeLoading, setResumeLoading] = useState(false);

  const messageListRef = useRef<MessageListHandle>(null);

  const fetchResumeSessions = () =>
    listSessions({
      limit: 50,
      excludeLive: true,
      ...(activeProjectCwd ? { cwd: activeProjectCwd } : {}),
    }).then((res) => {
      if (res.ok) setResumeSessions(res.data);
    });

  const openResumeOverlay = () => {
    setShowResumeOverlay(true);
    setResumeLoading(true);
    fetchResumeSessions().finally(() => setResumeLoading(false));
  };

  const handleDelete = async (id: string) => {
    const result = await deleteSession(id);
    if (result.ok) void fetchResumeSessions();
    return result;
  };

  const handleResumeSelect = async (selectedChannelId: string) => {
    const picked = resumeSessions.sessions.find((s) => s.channelId === selectedChannelId);
    if (!picked) return;
    setShowResumeOverlay(false);
    try {
      const { channelId: spawnedId } = await resume(picked.id);
      const route = resumeRoute({
        isEmpty: messages.length === 0,
        currentCwd: activeProjectCwd,
        currentChannelId: channelId,
        picked,
        spawnedChannelId: spawnedId,
      });
      if (route.type === 'replace') {
        replaceTab(route.oldChannelId, route.newChannelId);
      } else if (route.type === 'activate') {
        setActiveProject(route.cwd);
        requestActivateChannel(route.cwd, route.channelId);
      }
    } catch (err) {
      toast.error(`Resume failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  useHotkeys('/', () => focusTextarea(), NO_FORM);
  useHotkeys('mod+k', () => setCommandPaletteOpen(true), NO_FORM);
  useHotkeys('mod+f', () => setCommandPaletteOpen(true), NO_FORM);

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
        <HeaderBar title={title} onOpenCommandPalette={() => setCommandPaletteOpen(true)} />
        {worktree && <WorktreeBanner worktree={worktree} />}
        <CommandPalette
          open={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          onJumpTo={(id) => messageListRef.current?.scrollToMessage(id)}
          onToggleRawPanel={() => setActiveSidePanel((v) => (v === 'raw' ? null : 'raw'))}
          rawPanelActive={activeSidePanel === 'raw'}
        />
        <MessageList ref={messageListRef} />
        {showResumeOverlay && (
          <SessionDropdown
            sessions={resumeSessions.sessions}
            loading={resumeLoading}
            onSelect={handleResumeSelect}
            onClose={() => setShowResumeOverlay(false)}
            onRename={renameSession}
            onDelete={handleDelete}
          />
        )}
        <SideQuestionDialog
          open={sideQuestion.open}
          question={sideQuestion.question}
          answer={sideQuestion.answer}
          loading={sideQuestion.loading}
          error={sideQuestion.error}
          onClose={() => setSideQuestion((prev) => ({ ...prev, open: false }))}
        />
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <div className="max-w-[680px] mx-auto w-full flex flex-col gap-3">
            <ChatInputArea
              onResumeConversation={openResumeOverlay}
              onAskSideQuestion={handleAskSideQuestion}
            />
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
