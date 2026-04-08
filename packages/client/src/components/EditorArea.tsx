import { ChannelProvider } from '../contexts/channel';
import { useProjectState } from '../contexts/ProjectContext';
import { useSession } from '../contexts/SessionContext';
import { useTabActions, useTabState } from '../contexts/TabContext';
import { ChatPanel } from './ChatPanel';
import { TabBar } from './TabBar';

export function EditorArea() {
  const { activeTabId, tabs } = useTabState();
  const { setActiveTab, removeTab, createNewTab, setTabTitle, setTabStatus } = useTabActions();
  const { activeProjectCwd } = useProjectState();
  const { closeSession } = useSession();

  const handleCloseTab = (id: string) => {
    closeSession(id);
    removeTab(id);
  };

  // Filter tabs by active project cwd (show all if no active project)
  const filteredEntries = Object.entries(tabs).filter(
    ([, meta]) => !activeProjectCwd || meta.cwd === activeProjectCwd,
  );
  const tabIds = filteredEntries.map(([id]) => id);

  const openTabs = filteredEntries.map(([id, meta]) => ({
    sessionId: id,
    title: meta.title,
    status: meta.tabStatus,
  }));

  return (
    <div className="flex flex-col flex-1 h-full">
      <TabBar
        tabs={openTabs}
        activeTabId={activeTabId}
        onSelectTab={setActiveTab}
        onCloseTab={handleCloseTab}
        onNewTab={() => createNewTab(activeProjectCwd ? { cwd: activeProjectCwd } : undefined)}
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
