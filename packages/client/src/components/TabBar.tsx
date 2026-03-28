import { useState } from 'react';

export interface TabInfo {
  sessionId: string;
  title?: string;
  status: 'default' | 'pending' | 'done';
}

interface TabBarProps {
  tabs: TabInfo[];
  activeTabId: string | null;
  onSelectTab: (sessionId: string) => void;
  onCloseTab: (sessionId: string) => void;
  onNewTab?: () => void;
  onOpenHistory?: () => void;
}

const statusDot: Record<TabInfo['status'], string> = {
  default: 'bg-text-muted',
  pending: 'bg-warning',
  done: 'bg-success',
};

export function TabBar({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onOpenHistory,
}: TabBarProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  if (tabs.length === 0 && !onNewTab) return null;

  return (
    <div
      className="flex items-center gap-1 px-4 py-1 border-b border-border overflow-x-auto"
      data-testid="tab-bar"
    >
      {tabs.map((tab) => (
        <div
          key={tab.sessionId}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs cursor-pointer shrink-0 ${
            tab.sessionId === activeTabId
              ? 'text-text border-b-2 border-border-focus'
              : 'text-text-muted hover:text-text hover:bg-white/5'
          }`}
          onClick={() => onSelectTab(tab.sessionId)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectTab(tab.sessionId);
            }
          }}
          role="tab"
          tabIndex={0}
          aria-selected={tab.sessionId === activeTabId}
        >
          {tab.status === 'done' ? (
            <span
              className={`w-1.5 h-1.5 rounded-full ${statusDot.done} text-[8px] leading-none flex items-center justify-center`}
            >
              ✓
            </span>
          ) : (
            <span
              className={`w-1.5 h-1.5 rounded-full ${statusDot[tab.status]}${tab.status === 'pending' ? ' animate-pulse' : ''}`}
            />
          )}
          <span className="truncate max-w-[120px]">{tab.title || tab.sessionId.slice(0, 8)}</span>
          {confirmingId === tab.sessionId ? (
            <span
              className="ml-1 inline-flex items-center gap-1 text-[10px]"
              onClick={(e) => e.stopPropagation()}
              role="none"
            >
              <button
                type="button"
                onClick={() => {
                  onCloseTab(tab.sessionId);
                  setConfirmingId(null);
                }}
                className="text-danger hover:text-danger/80 font-medium"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmingId(null)}
                className="text-text-muted hover:text-text"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              type="button"
              className="ml-1 text-text-muted hover:text-text text-[10px]"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmingId(tab.sessionId);
              }}
              aria-label={`Close ${tab.title || tab.sessionId}`}
            >
              ✕
            </button>
          )}
        </div>
      ))}
      {onNewTab && (
        <button
          type="button"
          className="flex items-center justify-center w-6 h-6 rounded text-xs text-text-muted hover:text-text hover:bg-white/5 shrink-0"
          onClick={onNewTab}
          aria-label="New tab"
        >
          +
        </button>
      )}
      {onOpenHistory && (
        <button
          type="button"
          className="flex items-center justify-center w-6 h-6 rounded text-xs text-text-muted hover:text-text hover:bg-white/5 shrink-0 ml-auto"
          onClick={onOpenHistory}
          title="Session History"
        >
          ☰
        </button>
      )}
    </div>
  );
}
