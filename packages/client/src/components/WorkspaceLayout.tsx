import { ChannelProvider } from '../contexts/channel';
import { useSession } from '../contexts/SessionContext';
import { useTab } from '../contexts/TabContext';
import { ChatPanel } from './ChatPanel';
import { TabBar } from './TabBar';

export function WorkspaceLayout() {
  const { activeTabId, tabs, setActiveTab, removeTab, createNewTab, setTabTitle, setTabStatus } =
    useTab();
  const { closeSession } = useSession();

  const handleCloseTab = (id: string) => {
    closeSession(id);
    removeTab(id);
  };
  const tabIds = Object.keys(tabs);

  const openTabs = Object.entries(tabs).map(([id, meta]) => ({
    sessionId: id,
    title: meta.title,
    status: meta.tabStatus,
  }));

  return (
    <>
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
              onTitleChange={(title) => setTabTitle(id, title)}
              onStatusChange={(status) => setTabStatus(id, status)}
            >
              <ChatPanel title={tabs[id]?.title} />
            </ChannelProvider>
          </div>
        ))}
      </div>
    </>
  );
}
