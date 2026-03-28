import type { SessionSummary } from '@code-quest/shared';
import { useState } from 'react';
import { SessionRow } from './SessionRow';

const ICON_BTN = 'text-text-muted hover:text-text text-sm';

interface SessionHistoryProps {
  sessions: SessionSummary[];
  loading?: boolean;
  hasMore?: boolean;
  currentChannelId?: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
  onLoadMore?: () => void;
  onGetDetail?: (id: string) => Promise<SessionSummary | null>;
  onRename?: (id: string, title: string) => Promise<{ success: boolean; error?: string }>;
  onDelete?: (id: string) => Promise<{ success: boolean; error?: string }>;
  remoteSessions?: SessionSummary[];
  remoteLoading?: boolean;
  onLoadRemote?: () => void;
  onTeleport?: (channelId: string) => void;
  onExport?: (channelId: string) => void;
  onImport?: () => void;
  onJoin?: (channelId: string) => void;
  totalCount?: number;
}

export function SessionHistory({
  sessions,
  loading,
  hasMore,
  currentChannelId,
  onSelect,
  onClose,
  onLoadMore,
  onGetDetail,
  onRename,
  onDelete,
  remoteSessions = [],
  remoteLoading = false,
  onLoadRemote,
  onTeleport,
  onExport,
  onImport,
  onJoin,
  totalCount,
}: SessionHistoryProps) {
  const [activeTab, setActiveTab] = useState<'local' | 'remote'>('local');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const handleSwitchToRemote = () => {
    setActiveTab('remote');
    onLoadRemote?.();
  };

  const handleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const visibleSessions = sessions.filter((s) => !deletedIds.has(s.id));
  const displaySessions = activeTab === 'local' ? visibleSessions : (remoteSessions ?? []);
  const isLoading = activeTab === 'local' ? loading : remoteLoading;

  return (
    <div className="flex flex-col h-full bg-surface border-r border-border">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-medium text-text">
          Session History{' '}
          <span data-testid="session-count" className="text-text-muted font-normal">
            {totalCount !== undefined
              ? `(${sessions.length} of ${totalCount})`
              : `(${sessions.length})`}
          </span>
        </span>
        <div className="flex items-center gap-1">
          {onImport && (
            <button type="button" title="Import session" onClick={onImport} className={ICON_BTN}>
              ⬆
            </button>
          )}
          <button type="button" title="Close" onClick={onClose} className={ICON_BTN}>
            ✕
          </button>
        </div>
      </div>

      {onLoadRemote && (
        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab('local')}
            className={`flex-1 py-2 text-xs text-center transition-colors ${activeTab === 'local' ? 'text-accent border-b-2 border-accent font-medium' : 'text-text-muted hover:text-text'}`}
          >
            Local
          </button>
          <button
            type="button"
            onClick={handleSwitchToRemote}
            className={`flex-1 py-2 text-xs text-center transition-colors ${activeTab === 'remote' ? 'text-accent border-b-2 border-accent font-medium' : 'text-text-muted hover:text-text'}`}
          >
            Remote
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
        {isLoading && (
          <div className="px-4 py-8 text-center text-text-muted text-sm">Loading...</div>
        )}
        {!isLoading && displaySessions.length === 0 && (
          <div className="px-4 py-8 text-center text-text-muted text-sm">No sessions</div>
        )}
        {displaySessions.map((s) => (
          <SessionRow
            key={s.id}
            session={s}
            isExpanded={expandedId === s.id}
            isCurrent={currentChannelId === s.id}
            isRemote={activeTab === 'remote'}
            onExpand={handleExpand}
            onSelect={onSelect}
            onGetDetail={onGetDetail}
            onRename={onRename}
            onDelete={onDelete}
            onExport={onExport}
            onJoin={onJoin}
            onTeleport={onTeleport}
            onDeleted={(id) => setDeletedIds((prev) => new Set(prev).add(id))}
          />
        ))}
        {activeTab === 'local' && hasMore && onLoadMore && (
          <button
            type="button"
            onClick={onLoadMore}
            className="w-full py-3 text-center text-xs text-accent hover:underline"
          >
            Load More
          </button>
        )}
      </div>
    </div>
  );
}
