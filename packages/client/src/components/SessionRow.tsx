import type { RpcResult, SessionSummary } from '@code-quest/shared';
import { useEffect, useRef, useState } from 'react';
import { formatRelativeDate } from '../utils/format-relative-date';

interface SessionRowProps {
  session: SessionSummary;
  isFocused?: boolean;
  onSelect: (id: string) => void;
  onMouseEnter?: () => void;
  onRename?: (id: string, title: string) => Promise<RpcResult<Record<string, never>>>;
  onDelete?: (id: string) => Promise<RpcResult<Record<string, never>>>;
  searchQuery?: string;
}

function HighlightText({ text, query }: { text: string; query?: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-accent/30 text-inherit rounded-sm">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export function SessionRow({
  session: s,
  isFocused,
  onSelect,
  onMouseEnter,
  onRename,
  onDelete,
  searchQuery,
}: SessionRowProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  const handleRenameStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRenaming(true);
  };

  const finishRename = async () => {
    if (!isRenaming || !renameInputRef.current) return;
    const newTitle = renameInputRef.current.value.trim();
    setIsRenaming(false);
    if (newTitle && newTitle !== title && onRename) {
      const result = await onRename(s.channelId, newTitle);
      if (!result.ok) {
        console.warn('Rename failed:', result.error);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      renameInputRef.current?.blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setIsRenaming(false);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(s.channelId);
  };

  const title = s.title || s.firstUserMessage || 'Untitled';

  return (
    <div
      role="option"
      aria-selected={isFocused ?? false}
      tabIndex={0}
      data-testid="session-row"
      className={`flex items-center w-full text-left px-3 py-2 hover:bg-white/5 cursor-pointer group ${isFocused ? 'bg-selected' : ''}`}
      onClick={isRenaming ? undefined : () => onSelect(s.channelId)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (!isRenaming) onSelect(s.channelId);
        }
      }}
      onMouseEnter={onMouseEnter}
    >
      {isRenaming ? (
        <input
          ref={renameInputRef}
          type="text"
          defaultValue={title}
          className="flex-1 text-sm text-text truncate outline-none border-b border-accent bg-transparent min-w-0"
          onKeyDown={handleKeyDown}
          onBlur={finishRename}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="flex-1 text-sm text-text truncate">
          <HighlightText text={title} query={searchQuery} />
        </span>
      )}
      <span className="flex items-center gap-1 shrink-0 ml-2">
        <span className="text-xs text-text-muted">{formatRelativeDate(s.createdAt)}</span>
        {(onRename || onDelete) && (
          <span className="hidden group-hover:flex items-center gap-1">
            {onRename && (
              <button
                type="button"
                title="Rename"
                onClick={handleRenameStart}
                className="text-text-muted hover:text-text text-xs p-0.5"
              >
                ✏
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                title="Delete"
                onClick={handleDelete}
                className="text-text-muted hover:text-danger text-xs p-0.5"
              >
                🗑
              </button>
            )}
          </span>
        )}
      </span>
    </div>
  );
}
