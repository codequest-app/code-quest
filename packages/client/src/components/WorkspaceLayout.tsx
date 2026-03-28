import type { SessionSummary } from '@code-quest/shared';
import { useEffect, useMemo, useState } from 'react';
import { ChannelProvider } from '../contexts/channel';
import { useSession } from '../contexts/SessionContext';
import { useTab } from '../contexts/TabContext';
import { ChatPanel } from './ChatPanel';
import { SessionHistory } from './SessionHistory';
import { TabBar } from './TabBar';

const SIDE_PANEL = 'w-72 shrink-0';

export function WorkspaceLayout() {
  const {
    activeTabId,
    tabs,
    joinSession,
    setActiveTab,
    removeTab,
    createNewTab,
    setTabTitle,
    setTabStatus,
  } = useTab();
  const { listSessions } = useSession();
  const tabIds = Object.keys(tabs);

  // ── History sidebar (local UI state) ──
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<{ sessions: SessionSummary[]; total: number }>({
    sessions: [],
    total: 0,
  });
  const toggleHistory = () => setShowHistory((v) => !v);

  useEffect(() => {
    if (!showHistory) return;
    listSessions({ limit: 50 }).then(setHistory);
  }, [showHistory, listSessions]);

  const openTabs = useMemo(
    () =>
      Object.entries(tabs).map(([id, meta]) => ({
        sessionId: id,
        title: meta.title,
        status: meta.tabStatus,
      })),
    [tabs],
  );

  const handleSelectSession = (id: string) => {
    joinSession(id);
    setShowHistory(false);
  };

  return (
    <>
      <TabBar
        tabs={openTabs}
        activeTabId={activeTabId}
        onSelectTab={setActiveTab}
        onCloseTab={removeTab}
        onNewTab={() => createNewTab()}
        onOpenHistory={toggleHistory}
      />
      <div className="flex flex-1 overflow-hidden relative">
        {tabIds.map((id) => (
          <div key={id} className={id === activeTabId ? 'flex flex-1' : 'hidden'}>
            <ChannelProvider
              channelId={id}
              onTitleChange={(title) => setTabTitle(id, title)}
              onStatusChange={(status) => setTabStatus(id, status)}
            >
              <ChatPanel
                title={tabs[id]?.title}
                joinSession={joinSession}
                toggleHistory={toggleHistory}
              />
            </ChannelProvider>
          </div>
        ))}
        {showHistory && (
          <div className={SIDE_PANEL}>
            <SessionHistory
              sessions={history.sessions}
              totalCount={history.total}
              currentChannelId={activeTabId}
              onSelect={handleSelectSession}
              onClose={toggleHistory}
            />
          </div>
        )}
      </div>
    </>
  );
}
