import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { memo } from 'react';
import { ChannelProvider } from '../contexts/channel';
import { useSession } from '../contexts/SessionContext';
import { useTabActions, useTabState } from '../contexts/TabContext';
import { cn } from '../utils/cn';
import { ChatPanel } from './ChatPanel';
import { EmptyState } from './EmptyState';
import { TabBar } from './TabBar';

interface TabContentProps {
  channelId: string;
  cwd?: string;
  title?: string;
}

const TabContent = memo(function TabContent({ channelId, cwd, title }: TabContentProps) {
  const { setTabTitle, setTabStatus, createNewTab } = useTabActions();
  return (
    <ChannelProvider
      channelId={channelId}
      cwd={cwd}
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

export const EditorArea = memo(function EditorArea() {
  const { activeTabId, tabs } = useTabState();
  const { setActiveTab, removeTab, createNewTab } = useTabActions();
  const { closeSession } = useSession();

  const handleCloseTab = (id: string) => {
    closeSession(id);
    removeTab(id);
  };

  const tabEntries = Object.entries(tabs);
  const openTabs = tabEntries.map(([id, meta]) => ({
    sessionId: id,
    title: meta.title,
    status: meta.tabStatus,
  }));

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
    <div className="flex flex-col flex-1 min-w-0" data-testid="editor-area">
      <TabBar
        tabs={openTabs}
        activeTabId={activeTabId}
        onSelectTab={setActiveTab}
        onCloseTab={handleCloseTab}
        onNewTab={() => createNewTab()}
      />
      <div className="flex flex-1 overflow-hidden">
        {tabEntries.map(([id, meta]) => (
          <div
            key={id}
            data-testid={id === activeTabId ? 'tab-container' : undefined}
            className={cn(id === activeTabId ? 'flex flex-1 min-w-0' : 'hidden')}
          >
            <TabContent channelId={id} cwd={meta.cwd} title={meta.title} />
          </div>
        ))}
      </div>
    </div>
  );
});
