import type { SessionSummary } from '@code-quest/shared';
import { useEffect, useRef, useState } from 'react';
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
import { NO_FORM } from '@/utils/hotkey-options';
import { resumeRoute } from '@/utils/resume-route';
import { ChatPanel } from './ChatPanel.tsx';
import { ChatInputArea } from './compose/ChatInputArea.tsx';
import { MessageList, type MessageListHandle } from './conversation/MessageList.tsx';
import { ContentPreviewDialog } from './dialogs/ContentPreviewDialog.tsx';
import { ElicitationDialog } from './dialogs/ElicitationDialog.tsx';
import { SideQuestionDialog } from './dialogs/SideQuestionDialog.tsx';
import { HeaderBar } from './HeaderBar.tsx';
import { OnboardingOverlay } from './OnboardingOverlay.tsx';
import { ResumeButton } from './ResumeButton.tsx';
import { RawEventPanel } from './session/RawEventPanel.tsx';
import { WorktreeBanner } from './WorktreeBanner.tsx';

export function ChatSession({ title }: { title?: string }): React.JSX.Element {
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

  const [activeSidePanel, setActiveSidePanel] = useState<'raw' | null>(null);
  const messageListRef = useRef<MessageListHandle>(null);

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
    <>
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
          onClose={clearPendingDiffReview}
        />
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
      <SideQuestionDialog
        open={sideQuestion.open}
        question={sideQuestion.question}
        answer={sideQuestion.answer}
        loading={sideQuestion.loading}
        error={sideQuestion.error}
        onClose={() => btwSignal.setState({ open: false })}
      />
      <ChatPanel>
        <ChatPanel.Header>
          <HeaderBar title={title}>
            <ResumeButton onResumed={handleResumed} />
          </HeaderBar>
          {worktree && <WorktreeBanner worktree={worktree} />}
        </ChatPanel.Header>
        <ChatPanel.Body>
          <MessageList ref={messageListRef} />
        </ChatPanel.Body>
        <ChatPanel.Footer>
          <ChatInputArea />
        </ChatPanel.Footer>
        {activeSidePanel === 'raw' && (
          <ChatPanel.Side>
            <RawEventPanel
              onSubscribe={subscribeRawEvents}
              onClose={() => setActiveSidePanel(null)}
            />
          </ChatPanel.Side>
        )}
      </ChatPanel>
    </>
  );
}
