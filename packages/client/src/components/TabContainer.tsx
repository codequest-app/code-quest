import { ChatBubbleLeftRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { memo } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { ChannelProvider } from '../contexts/channel';
import { useGitState } from '../contexts/GitContext';
import { useSession } from '../contexts/SessionContext';
import { type TabMeta, useTabActions, useTabState } from '../contexts/TabContext';
import { useActiveChatTabCwdPublisher } from '../hooks/useActiveChatTabCwdPublisher';
import { basename } from '../utils/basename';
import { cn } from '../utils/cn';
import { findWorktreeByCwd } from '../utils/findWorktreeByCwd';
import { ChatPanel } from './ChatPanel';
import { EmptyState } from './EmptyState';
import { TabBar } from './TabBar';

interface TabContentProps extends Pick<TabMeta, 'cwd' | 'title' | 'launchOnMount'> {
  channelId: string;
}

const TabContent = memo(function TabContent({
  channelId,
  cwd,
  title,
  launchOnMount,
}: TabContentProps) {
  const { setTabTitle, setTabStatus, createNewTab } = useTabActions();
  return (
    <ChannelProvider
      channelId={channelId}
      cwd={cwd}
      launchOnMount={launchOnMount}
      onChange={(update) => {
        if (update.title) setTabTitle(channelId, update.title);
        if (update.status) setTabStatus(channelId, update.status);
      }}
      onNewChannel={(newCwd) => createNewTab({ cwd: newCwd })}
    >
      <ChatPanel title={title} />
    </ChannelProvider>
  );
});

function SplitHalf({
  channelId,
  meta,
  isActive,
  onClose,
}: {
  channelId: string;
  meta: TabMeta;
  isActive: boolean;
  onClose: () => void;
}) {
  return (
    <div
      data-testid={isActive ? 'split-half-active' : 'split-half-secondary'}
      className={cn(
        'flex flex-col h-full border-l-2',
        isActive ? 'border-accent' : 'border-transparent',
      )}
    >
      <div className="flex items-center gap-2 px-2 py-1 border-b border-border bg-surface text-xs">
        <span className="font-mono text-text-muted truncate">{meta.title ?? channelId}</span>
        <button
          type="button"
          aria-label="Close split"
          className="ml-auto text-text-dim hover:text-text"
          onClick={onClose}
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-1 min-h-0 min-w-0">
        <TabContent
          channelId={channelId}
          cwd={meta.cwd}
          title={meta.title}
          launchOnMount={meta.launchOnMount}
        />
      </div>
    </div>
  );
}

export const TabContainer = memo(function TabContainer({ projectCwd }: { projectCwd: string }) {
  const { activeTabId, splitTabId, tabs } = useTabState();
  const { setActiveTab, removeTab, createNewTab, enterSplit, exitSplit } = useTabActions();
  const { closeSession } = useSession();
  const { listing } = useGitState();
  // Publish this project's active-tab cwd to ActiveChatTabCwdContext when this
  // project is the globally-active project. Bridges TabProvider boundary
  // so RightPaneWithCwd (rendered above) follows tab switches.
  useActiveChatTabCwdPublisher(projectCwd);

  const handleCloseTab = (id: string) => {
    closeSession(id);
    removeTab(id);
  };

  const tabEntries = Object.entries(tabs);
  const openTabs = tabEntries.map(([id, meta]) => {
    const found = findWorktreeByCwd(listing, meta.cwd);
    return {
      sessionId: id,
      title: meta.title,
      status: meta.tabStatus,
      worktree: found
        ? { name: found.worktree.name, path: found.worktree.path, branch: found.worktree.branch }
        : undefined,
      projectName: found ? basename(found.projectCwd) : undefined,
    };
  });

  if (tabEntries.length === 0) {
    return (
      <EmptyState
        icon={<ChatBubbleLeftRightIcon className="w-10 h-10" />}
        message="No open sessions"
        actionLabel="New Session"
        onAction={() => createNewTab()}
      />
    );
  }

  return (
    <div className="flex flex-col flex-1 min-w-0" data-testid="tab-container-root">
      <TabBar
        tabs={openTabs}
        activeTabId={activeTabId}
        onSelectTab={setActiveTab}
        onSplitTab={enterSplit}
        onCloseTab={handleCloseTab}
        onNewTab={() => createNewTab()}
      />
      {splitTabId && activeTabId && tabs[splitTabId] ? (
        <div className="flex flex-1 overflow-hidden" data-testid="tab-container-split">
          <PanelGroup direction="horizontal" autoSaveId="cc-office.chat-split">
            <Panel id="left" defaultSize={50} minSize={25}>
              <SplitHalf
                channelId={activeTabId}
                meta={tabs[activeTabId]}
                isActive
                onClose={exitSplit}
              />
            </Panel>
            <PanelResizeHandle className="w-px bg-border hover:bg-accent" />
            <Panel id="right" defaultSize={50} minSize={25}>
              <SplitHalf
                channelId={splitTabId}
                meta={tabs[splitTabId]}
                isActive={false}
                onClose={exitSplit}
              />
            </Panel>
          </PanelGroup>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {tabEntries.map(([id, meta]) => (
            <div
              key={id}
              data-testid={id === activeTabId ? 'tab-container' : undefined}
              className={cn(id === activeTabId ? 'flex flex-1 min-w-0' : 'hidden')}
            >
              <TabContent
                channelId={id}
                cwd={meta.cwd}
                title={meta.title}
                launchOnMount={meta.launchOnMount}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
