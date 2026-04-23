import { useEffect, useMemo, useRef, useState } from 'react';

interface Props {
  x: number;
  y: number;
  branches: string[];
  current: string | null;
  onSelect: (branch: string) => void;
  /**
   * When called with no arg → user picked the generic "+ New branch (worktree)…" action.
   * When called with a string → user typed a filter that matched nothing and clicked
   * "Create '<filter>' as new branch" in the empty state.
   */
  onCreateBranch: (filterValue?: string) => void;
  onClose: () => void;
}

/** Re-order so `current` (if present) is first, followed by the rest in original order. */
function pinCurrent(branches: string[], current: string | null): string[] {
  if (!current || !branches.includes(current)) return branches;
  return [current, ...branches.filter((b) => b !== current)];
}

export function BranchPopover({
  x,
  y,
  branches,
  current,
  onSelect,
  onCreateBranch,
  onClose,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState('');
  const [cursor, setCursor] = useState(0);

  const visible = useMemo(() => {
    const ordered = pinCurrent(branches, current);
    const needle = filter.trim().toLowerCase();
    if (!needle) return ordered;
    return ordered.filter((b) => b.toLowerCase().includes(needle));
  }, [branches, current, filter]);

  // Keep cursor inside visible bounds whenever the filtered list shrinks.
  useEffect(() => {
    if (cursor > visible.length - 1) setCursor(Math.max(0, visible.length - 1));
  }, [cursor, visible.length]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCursor((c) => Math.min(c + 1, Math.max(0, visible.length - 1)));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCursor((c) => Math.max(0, c - 1));
        return;
      }
      if (e.key === 'Enter') {
        const picked = visible[cursor];
        if (picked) {
          e.preventDefault();
          onSelect(picked);
          onClose();
        }
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose, onSelect, visible, cursor]);

  const trimmedFilter = filter.trim();
  const hasMatches = visible.length > 0;

  return (
    <div
      ref={ref}
      role="menu"
      style={{ position: 'fixed', left: `${x}px`, top: `${y}px` }}
      className="z-modal min-w-56 rounded border border-border bg-surface shadow-lg py-1"
    >
      <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
        Branches
      </div>
      <div className="px-2 pb-1">
        <input
          ref={inputRef}
          type="text"
          aria-label="Filter branches"
          placeholder="Filter branches…"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setCursor(0);
          }}
          className="w-full px-2 py-1 text-xs rounded bg-bg/60 border border-border focus:border-accent outline-none"
        />
      </div>
      <div data-testid="branch-list" className="max-h-80 overflow-y-auto border-t border-border">
        {hasMatches ? (
          visible.map((b, i) => {
            const isCurrent = b === current;
            const isCursor = i === cursor;
            return (
              <button
                key={b}
                type="button"
                role="menuitem"
                data-kind="branch"
                data-cursor={isCursor || undefined}
                onClick={() => {
                  onSelect(b);
                  onClose();
                }}
                className={`flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm text-text hover:bg-white/5 ${
                  isCursor ? 'bg-white/5' : ''
                }`}
              >
                <span className="w-3 text-text-subtle">{isCurrent ? '✓' : ''}</span>
                <span className="truncate">{b}</span>
              </button>
            );
          })
        ) : (
          <button
            type="button"
            role="menuitem"
            data-kind="create-from-filter"
            onClick={() => {
              onCreateBranch(trimmedFilter);
              onClose();
            }}
            className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-text-muted hover:text-text hover:bg-white/5"
          >
            <span className="w-3">+</span>
            <span>
              Create <span className="font-mono text-text">"{trimmedFilter}"</span> as new branch
            </span>
          </button>
        )}
      </div>
      <div className="my-1 border-t border-border" />
      <button
        type="button"
        role="menuitem"
        data-kind="create-new"
        onClick={() => {
          onCreateBranch();
          onClose();
        }}
        className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm text-text-muted hover:text-text hover:bg-white/5"
      >
        <span className="w-3">+</span>
        <span>New branch (worktree)…</span>
      </button>
    </div>
  );
}
