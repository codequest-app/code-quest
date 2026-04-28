import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import * as Tabs from '@radix-ui/react-tabs';
import { memo, useEffect } from 'react';
import { ChannelProvider } from '../contexts/channel';
import { useGitState } from '../contexts/GitContext';
import { useNavigationActions } from '../contexts/NavigationContext';
import { useProjectState } from '../contexts/ProjectContext';
import { useSession } from '../contexts/SessionContext';
import { type TabMeta, useTabActions, useTabState } from '../contexts/TabContext';
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

export const TabContainer: React.MemoExoticComponent<
  (props: { projectCwd: string }) => React.JSX.Element
> = memo(function TabContainer({ projectCwd }: { projectCwd: string }): React.JSX.Element {
  const { activeTabId, tabs } = useTabState();
  const { setActiveTab, removeTab, createNewTab } = useTabActions();
  const { closeSession } = useSession();
  const { listing } = useGitState();
  const { setActiveCwd } = useNavigationActions();
  const { activeProjectCwd } = useProjectState();

  const isThisActive = projectCwd === activeProjectCwd;
  const activeTabCwd = activeTabId ? (tabs[activeTabId]?.cwd ?? null) : null;

  useEffect(() => {
    if (!isThisActive) return;
    setActiveCwd(activeTabCwd);
  }, [isThisActive, activeTabCwd, setActiveCwd]);

  // Separate effect: cleanup on active→inactive must not depend on
  // activeTabCwd, otherwise switching tabs would flap to null then new cwd.
  useEffect(() => {
    if (!isThisActive) return;
    return () => {
      setActiveCwd(null);
    };
  }, [isThisActive, setActiveCwd]);

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
