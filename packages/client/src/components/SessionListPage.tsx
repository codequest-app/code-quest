import type { SessionSummary } from '@code-quest/shared';
import { useCallback, useEffect, useState } from 'react';
import { useSession } from '../contexts/SessionContext';
import { SessionHistory } from './SessionHistory';

const PAGE_SIZE = 20;

interface SessionListPageProps {
  onSelect: (channelId: string) => void;
  onJoin?: (channelId: string) => void;
}

export function SessionListPage({ onSelect, onJoin }: SessionListPageProps) {
  const { listSessions } = useSession();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setOffset(0);
    try {
      const result = await listSessions({ limit: PAGE_SIZE, offset: 0 });
      setSessions(result.sessions);
      setHasMore(result.sessions.length >= PAGE_SIZE);
    } finally {
      setLoading(false);
    }
  }, [listSessions]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleLoadMore = useCallback(async () => {
    const newOffset = offset + PAGE_SIZE;
    const result = await listSessions({ limit: PAGE_SIZE, offset: newOffset });
    setSessions((prev) => [...prev, ...result.sessions]);
    setOffset(newOffset);
    setHasMore(result.sessions.length >= PAGE_SIZE);
  }, [offset, listSessions]);

  return (
    <div className="h-full w-full" data-testid="session-list-page">
      <SessionHistory
        sessions={sessions}
        loading={loading}
        hasMore={hasMore}
        currentChannelId={null}
        onSelect={onSelect}
        onClose={() => {}}
        onLoadMore={handleLoadMore}
        onJoin={onJoin}
      />
    </div>
  );
}
