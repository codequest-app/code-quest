import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import * as Tabs from '@radix-ui/react-tabs';
import { memo } from 'react';
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

export const TabContainer = memo(function TabContainer({ projectCwd }: { projectCwd: string }) {
  const { activeTabId, tabs } = useTabState();
  const { setActiveTab, removeTab, createNewTab } = useTabActions();
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
    <Tabs.Root
      value={activeTabId ?? undefined}
      onValueChange={setActiveTab}
      className="flex flex-col flex-1 min-w-0"
      aria-label="tab-container-root"
    >
      <TabBar
        tabs={openTabs}
        activeTabId={activeTabId}
        onSelectTab={setActiveTab}
        onCloseTab={handleCloseTab}
        onNewTab={() => createNewTab()}
      />
      <div className="flex flex-1 overflow-hidden">
        {tabEntries.map(([id, meta]) => (
          <Tabs.Content
            key={id}
            value={id}
            forceMount
            hidden={id !== activeTabId}
            aria-label={id === activeTabId ? 'tab-container' : undefined}
            className={cn(id === activeTabId ? 'flex flex-1 min-w-0' : undefined)}
          >
            <TabContent
              channelId={id}
              cwd={meta.cwd}
              title={meta.title}
              launchOnMount={meta.launchOnMount}
            />
          </Tabs.Content>
        ))}
      </div>
    </Tabs.Root>
  );
});
