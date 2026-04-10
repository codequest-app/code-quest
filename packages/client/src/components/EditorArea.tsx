import { ChannelProvider } from '../contexts/channel';
import { useSession } from '../contexts/SessionContext';
import { useTabActions, useTabState } from '../contexts/TabContext';
import { ChatPanel } from './ChatPanel';
import { EmptyState } from './EmptyState';
import { TabBar } from './TabBar';

export function EditorArea() {
  const { activeTabId, tabs } = useTabState();
  const { setActiveTab, removeTab, createNewTab, setTabTitle, setTabStatus } = useTabActions();
  const { closeSession } = useSession();

  const handleCloseTab = (id: string) => {
    closeSession(id);
    removeTab(id);
  };

  const tabEntries = Object.entries(tabs);
  const tabIds = tabEntries.map(([id]) => id);

  const openTabs = tabEntries.map(([id, meta]) => ({
    sessionId: id,
    title: meta.title,
    status: meta.tabStatus,
  }));

  if (tabIds.length === 0) {
    return (
      <EmptyState
        icon="💬"
        message="No open sessions"
        actionLabel="＋ New Session"
        onAction={() => createNewTab()}
      />
    );
  }

  return (
    <div className="flex flex-col flex-1 h-full">
      <TabBar
        tabs={openTabs}
        activeTabId={activeTabId}
        onSelectTab={setActiveTab}
        onCloseTab={handleCloseTab}
        onNewTab={() => createNewTab()}
      />
      <div className="flex flex-1 overflow-hidden relative">
        {tabIds.map((id) => (
          <div key={id} className={id === activeTabId ? 'flex flex-1' : 'hidden'}>
            <ChannelProvider
              channelId={id}
              cwd={tabs[id]?.cwd}
              onChange={(update) => {
                if (update.title) setTabTitle(id, update.title);
                if (update.status) setTabStatus(id, update.status);
              }}
              onNewChannel={(cwd) => createNewTab({ cwd })}
            >
              <ChatPanel title={tabs[id]?.title} />
            </ChannelProvider>
          </div>
        ))}
      </div>
    </div>
  );
}
