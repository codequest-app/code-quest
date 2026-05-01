import type { SessionSummary } from '@code-quest/shared';
import * as Popover from '@radix-ui/react-popover';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useCommandPalette } from '@/contexts/CommandPaletteContext';
import {
  useChannelComposeActions,
  useChannelConfig,
  useChannelControl,
  useChannelId,
  useChannelMessages,
} from '@/contexts/channel';
import { useNavigationActions } from '@/contexts/NavigationContext';
import { useProjectActions, useProjectState } from '@/contexts/ProjectContext';
import { useTabActions } from '@/contexts/TabContext';
import { btwSignal, useBtwState } from '@/features/btw/btw-feature';
import { resumeOpenSignal } from '@/features/resume/resume-feature';
import { cn } from '@/utils/cn';
import { resumeRoute } from '@/utils/resume-route';
import { ChatInputArea } from './compose/ChatInputArea';
import { MessageList, type MessageListHandle } from './conversation/MessageList';
import { ContentPreviewDialog } from './dialogs/ContentPreviewDialog';
import { ElicitationDialog } from './dialogs/ElicitationDialog';
import { SideQuestionDialog } from './dialogs/SideQuestionDialog';
import { HeaderBar } from './HeaderBar';
import { OnboardingOverlay } from './OnboardingOverlay';
import { RawEventPanel } from './session/RawEventPanel';
import { SessionHistoryPopover } from './session/SessionHistoryPopover';
import { WorktreeBanner } from './WorktreeBanner';

const SIDE_PANEL = 'w-72 shrink-0';
const NO_FORM = { enableOnFormTags: false, preventDefault: true } as const;

export function ChatPanel({ title }: { title?: string }): React.JSX.Element {
  const channelId = useChannelId();
  const { messages, subscribeRawEvents } = useChannelMessages();
  const sideQuestion = useBtwState();
  const { worktree } = useChannelConfig();
  const { focusTextarea } = useChannelComposeActions();
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

  const { openPalette, registerJumpTo, unregisterJumpTo } = useCommandPalette();
  const resumeIsOpen = useSyncExternalStore(
    (cb) => resumeOpenSignal.subscribe(cb),
    () => resumeOpenSignal.isOpen,
  );

  const [activeSidePanel, setActiveSidePanel] = useState<'raw' | null>(null);

  const messageListRef = useRef<MessageListHandle>(null);
  const chatColumnRef = useRef<HTMLDivElement>(null);

  const handleResumeOpenChange = (open: boolean) => {
    resumeOpenSignal.setOpen(open);
  };

  const handleResumed = (spawnedId: string, picked: SessionSummary) => {
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
  };

  useEffect(() => {
    if (!channelId) return;
    const scrollTo = (messageId: string) => messageListRef.current?.scrollToMessage(messageId);
    registerJumpTo(channelId, scrollTo);
    return () => unregisterJumpTo(channelId);
  }, [channelId, registerJumpTo, unregisterJumpTo]);

  useHotkeys('/', () => focusTextarea(), NO_FORM);
  useHotkeys('mod+f', () => openPalette({ tab: 'messages' }), NO_FORM);

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
      <div ref={chatColumnRef} data-chat-column className="relative flex flex-col flex-1 min-w-0">
        <Popover.Root open={resumeIsOpen} onOpenChange={handleResumeOpenChange}>
          <HeaderBar title={title} showResumeButton />
          {resumeIsOpen && (
            <SessionHistoryPopover
              cwd={activeProjectCwd ?? undefined}
              onClose={() => handleResumeOpenChange(false)}
              onResumed={handleResumed}
              side="bottom"
              align="end"
            />
          )}
        </Popover.Root>
        {worktree && <WorktreeBanner worktree={worktree} />}
        <MessageList ref={messageListRef} />
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
