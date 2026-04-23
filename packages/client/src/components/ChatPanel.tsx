import type { SessionSummary } from '@code-quest/shared';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { toast } from 'sonner';
import {
  useChannelComposeActions,
  useChannelConfig,
  useChannelControl,
  useChannelId,
  useChannelMessages,
} from '../contexts/channel';
import { useNavigationActions } from '../contexts/NavigationContext';
import { useProjectActions, useProjectState } from '../contexts/ProjectContext';
import { useSession } from '../contexts/SessionContext';
import { useTabActions } from '../contexts/TabContext';
import { btwSignal, useBtwState } from '../features/btw/btw-feature';
import { resumeOpenSignal } from '../features/resume/resume-feature';
import { cn } from '../utils/cn';
import { resumeRoute } from '../utils/resume-route';
import { ChatInputArea } from './ChatInputArea';
import { CommandPalette } from './CommandPalette';
import { ContentPreviewDialog } from './ContentPreviewDialog';
import { ElicitationDialog } from './ElicitationDialog';
import { HeaderBar } from './HeaderBar';
import { MessageList, type MessageListHandle } from './MessageList';
import { OnboardingOverlay } from './OnboardingOverlay';
import { RawEventPanel } from './RawEventPanel';
import { SessionDropdown } from './SessionDropdown';
import { SideQuestionDialog } from './SideQuestionDialog';
import { WorktreeBanner } from './WorktreeBanner';

const SIDE_PANEL = 'w-72 shrink-0';
const NO_FORM = { enableOnFormTags: false, preventDefault: true } as const;

export function ChatPanel({ title }: { title?: string }) {
  const channelId = useChannelId();
  const { messages, subscribeRawEvents } = useChannelMessages();
  const sideQuestion = useBtwState();
  const { worktree } = useChannelConfig();
  const { focusTextarea } = useChannelComposeActions();
  const { listSessions, renameSession, deleteSession, resume } = useSession();
  const { setActiveProject } = useProjectActions();
  const { requestActivateChannel } = useNavigationActions();
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

  const resumeIsOpen = useSyncExternalStore(
    (cb) => resumeOpenSignal.subscribe(cb),
    () => resumeOpenSignal.isOpen,
  );
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const [activeSidePanel, setActiveSidePanel] = useState<'raw' | null>(null);
  const [showResumeOverlay, setShowResumeOverlay] = useState(false);
  const [resumeSessions, setResumeSessions] = useState<{
    sessions: SessionSummary[];
    total: number;
  }>({ sessions: [], total: 0 });
  const [resumeLoading, setResumeLoading] = useState(false);

  const messageListRef = useRef<MessageListHandle>(null);
  const chatColumnRef = useRef<HTMLDivElement>(null);

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

  // biome-ignore lint/correctness/useExhaustiveDependencies: openResumeOverlay stable via React Compiler
  useEffect(() => {
    if (resumeIsOpen) openResumeOverlay();
  }, [resumeIsOpen]);

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
    <div className="flex flex-1 overflow-hidden min-w-0">
      <OnboardingOverlay />
      {pendingDiffReview && (
        <ContentPreviewDialog
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
      <div ref={chatColumnRef} className="relative flex flex-col flex-1 min-w-0">
        <HeaderBar
          title={title}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onOpenResume={openResumeOverlay}
        />
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
            onClose={() => {
              setShowResumeOverlay(false);
              resumeOpenSignal.setOpen(false);
            }}
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
          container={chatColumnRef.current}
          onClose={() => btwSignal.setState({ open: false })}
        />
        <div className="absolute bottom-0 left-0 right-0 z-sticky bg-gradient-to-t from-bg from-20% to-transparent px-4 pb-4 pt-1">
          <div className="max-w-170 mx-auto w-full flex flex-col gap-3">
            <ChatInputArea />
          </div>
        </div>
      </div>
      {activeSidePanel === 'raw' && (
        <div className={cn('fixed inset-0 z-modal', SIDE_PANEL, 'md:static md:inset-auto')}>
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
