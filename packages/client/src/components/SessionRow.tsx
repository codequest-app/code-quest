import type { SessionSummary } from '@code-quest/shared';
import { type KeyboardEvent, useState } from 'react';

const SMALL_ICON_BTN = 'text-text-muted hover:text-text text-[11px] p-1';

interface SessionRowProps {
  session: SessionSummary;
  isExpanded: boolean;
  isCurrent: boolean;
  isRemote: boolean;
  onExpand: (id: string) => void;
  onSelect: (id: string) => void;
  onGetDetail?: (id: string) => Promise<SessionSummary | null>;
  onRename?: (id: string, title: string) => Promise<{ success: boolean; error?: string }>;
  onDelete?: (id: string) => Promise<{ success: boolean; error?: string }>;
  onExport?: (id: string) => void;
  onJoin?: (id: string) => void;
  onTeleport?: (id: string) => void;
  onDeleted: (id: string) => void;
}

export function SessionRow({
  session: s,
  isExpanded,
  isCurrent,
  isRemote,
  onExpand,
  onSelect,
  onGetDetail,
  onRename,
  onDelete,
  onExport,
  onJoin,
  onTeleport,
  onDeleted,
}: SessionRowProps) {
  const [detail, setDetail] = useState<SessionSummary | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleExpandClick = async () => {
    if (isExpanded) {
      onExpand(s.id);
      setDetail(null);
      return;
    }
    onExpand(s.id);
    if (!onGetDetail) return;
    setDetailLoading(true);
    setDetailError(null);
    try {
      const result = await onGetDetail(s.id);
      setDetail(result);
    } catch {
      setDetailError('Failed to load details');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRenameStart = () => {
    setIsRenaming(true);
    setRenameValue(s.title ?? '');
  };

  const handleRenameSubmit = async () => {
    if (!onRename || !renameValue.trim()) {
      setIsRenaming(false);
      return;
    }
    await onRename(s.id, renameValue.trim());
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      setIsRenaming(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    const result = await onDelete(s.id);
    if (result.success) onDeleted(s.id);
    setConfirmDelete(false);
  };

  return (
    <div className="border-b border-border">
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => (onGetDetail ? handleExpandClick() : onSelect(s.id))}
          className="flex-1 text-left px-4 py-3 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-medium text-text truncate">{s.title || s.id}</div>
            <div className="text-[10px] text-text-muted shrink-0">
              {new Date(s.createdAt).toLocaleString()}
            </div>
          </div>
          {s.cwd && (
            <div className="text-[10px] font-mono text-text-muted truncate mt-0.5">
              {s.cwd.split('/').pop() || s.cwd}
            </div>
          )}
          {s.lastAssistantMessage && (
            <div
              data-testid="session-preview"
              className="text-[11px] text-text-muted truncate mt-0.5"
            >
              {s.lastAssistantMessage.length > 80
                ? `${s.lastAssistantMessage.slice(0, 80)}...`
                : s.lastAssistantMessage}
            </div>
          )}
        </button>
        <div className="flex items-center gap-1 pr-2">
          {onJoin && s.isActive && (
            <button
              type="button"
              title="Join session"
              onClick={() => onJoin(s.id)}
              className="text-xs px-2 py-0.5 rounded bg-accent/20 hover:bg-accent/40 text-accent transition-colors"
            >
              Join
            </button>
          )}
          {onExport && (
            <button
              type="button"
              title="Export session"
              onClick={() => onExport(s.id)}
              className={SMALL_ICON_BTN}
            >
              ⬇
            </button>
          )}
          {isRemote && onTeleport && (
            <button
              type="button"
              title="Teleport session"
              onClick={() => onTeleport(s.id)}
              className="text-text-muted hover:text-accent text-[11px] p-1"
            >
              ⬇
            </button>
          )}
          {onRename && (
            <button
              type="button"
              title="Rename session"
              onClick={handleRenameStart}
              className={SMALL_ICON_BTN}
            >
              ✏
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              title="Delete session"
              onClick={() => (isCurrent ? undefined : setConfirmDelete(true))}
              disabled={isCurrent}
              className="text-text-muted hover:text-danger text-[11px] p-1 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              🗑
            </button>
          )}
        </div>
      </div>

      {isRenaming && (
        <div className="px-4 pb-2">
          <input
            ref={(el) => el?.focus()}
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={handleRenameKeyDown}
            onBlur={() => setIsRenaming(false)}
            placeholder="Enter new name..."
            aria-label="Rename session"
            className="w-full bg-bg border border-border rounded px-2 py-1 text-xs text-text focus:outline-none focus:border-accent"
          />
        </div>
      )}

      {confirmDelete && (
        <div className="px-4 pb-2 flex items-center gap-2 text-[11px]">
          <span className="text-warning">Delete this session?</span>
          <button
            type="button"
            onClick={handleDelete}
            className="text-danger hover:text-danger/80 font-medium"
          >
            Confirm
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(false)}
            className="text-text-muted hover:text-text"
          >
            Cancel
          </button>
        </div>
      )}

      {isExpanded && (
        <div className="px-4 pb-3">
          {detailLoading && <div className="text-[11px] text-text-muted">Loading details...</div>}
          {detailError && <div className="text-[11px] text-danger">{detailError}</div>}
          {detail && !detailLoading && (
            <div className="text-[11px] text-text-muted space-y-1">
              {detail.cwd && (
                <div>
                  cwd: <span className="font-mono">{detail.cwd}</span>
                </div>
              )}
              {detail.args && <div>command: {detail.args}</div>}
              <div>created: {new Date(detail.createdAt).toLocaleString()}</div>
            </div>
          )}
          <button
            type="button"
            onClick={() => onSelect(s.id)}
            className="mt-2 text-[11px] text-accent hover:underline"
          >
            Resume this session
          </button>
        </div>
      )}
    </div>
  );
}
