import type { SessionSummary } from '@code-quest/shared';
import { useState } from 'react';
import { SessionRow } from './SessionRow';

interface SessionHistoryProps {
  sessions: SessionSummary[];
  loading?: boolean;
  onSelect: (id: string) => void;
  onRename?: (id: string, title: string) => Promise<{ success: boolean; error?: string }>;
  onDelete?: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export function SessionHistory({
  sessions,
  loading,
  onSelect,
  onRename,
  onDelete,
}: SessionHistoryProps) {
  const [search, setSearch] = useState('');
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [focusIndex, setFocusIndex] = useState(0);

  const visible = sessions.filter((s) => !deletedIds.has(s.id));
  const filtered = (() => {
    if (!search.trim()) return visible;
    const q = search.toLowerCase();
    return visible.filter((s) => (s.title ?? s.id).toLowerCase().includes(q));
  })();

  const handleDelete = async (id: string) => {
    if (!onDelete) return { success: false };
    const result = await onDelete(id);
    if (result.success) setDeletedIds((prev) => new Set(prev).add(id));
    return result;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusIndex((prev) => Math.min(prev + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[focusIndex]) {
          onSelect(filtered[focusIndex].id);
        }
        break;
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-surface">
      <div className="px-3 pt-3 pb-2">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setFocusIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search sessions..."
          className="w-full bg-bg border border-border rounded px-2 py-1.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
        />
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-thin">
        {loading && <div className="px-3 py-8 text-center text-text-muted text-sm">Loading...</div>}
        {!loading && filtered.length === 0 && (
          <div className="px-3 py-8 text-center text-text-muted text-sm">No sessions</div>
        )}
        {filtered.map((s, i) => (
          <SessionRow
            key={s.id}
            session={s}
            isFocused={i === focusIndex}
            onSelect={onSelect}
            onMouseEnter={() => setFocusIndex(i)}
            onRename={onRename}
            onDelete={onDelete ? handleDelete : undefined}
            searchQuery={search || undefined}
          />
        ))}
      </div>
    </div>
  );
}
