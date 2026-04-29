import * as Popover from '@radix-ui/react-popover';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';

interface Props {
  /** Element that opens the popover when clicked. Wrapped in `Popover.Trigger asChild`. */
  trigger: ReactNode;
  branches: string[];
  current: string | null;
  onSelect: (branch: string) => void;
  /**
   * When called with no arg → user picked the generic "+ New branch (worktree)…" action.
   * When called with a string → user typed a filter that matched nothing and clicked
   * "Create '<filter>' as new branch" in the empty state.
   *
   * Omit to hide both create affordances — suits contexts where branch
   * creation happens elsewhere (e.g. the sidebar's CreateWorktreeDialog).
   */
  onCreateBranch?: (filterValue?: string) => void;
  /** Open the popover on mount — used by tests; in production let Radix manage it. */
  defaultOpen?: boolean;
  /** Controlled open. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function pinCurrent(branches: string[], current: string | null): string[] {
  if (!current || !branches.includes(current)) return branches;
  return [current, ...branches.filter((b) => b !== current)];
}

export function BranchPopover({
  trigger,
  branches,
  current,
  onSelect,
  onCreateBranch,
  defaultOpen,
  open,
  onOpenChange,
}: Props): React.JSX.Element {
  return (
    <Popover.Root defaultOpen={defaultOpen} open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          role="menu"
          side="bottom"
          align="start"
          sideOffset={2}
          collisionPadding={8}
          className="z-modal min-w-56 rounded border border-border bg-surface shadow-floating py-1"
        >
          <BranchPopoverBody
            branches={branches}
            current={current}
            onSelect={onSelect}
            onCreateBranch={onCreateBranch}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

interface BodyProps {
  branches: string[];
  current: string | null;
  onSelect: (branch: string) => void;
  onCreateBranch?: (filterValue?: string) => void;
}

function BranchPopoverBody({ branches, current, onSelect, onCreateBranch }: BodyProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState('');
  const [cursor, setCursor] = useState(0);

  const visible = useMemo(() => {
    const ordered = pinCurrent(branches, current);
    const needle = filter.trim().toLowerCase();
    if (!needle) return ordered;
    return ordered.filter((b) => b.toLowerCase().includes(needle));
  }, [branches, current, filter]);

  useEffect(() => {
    if (cursor > visible.length - 1) setCursor(Math.max(0, visible.length - 1));
  }, [cursor, visible.length]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const trimmedFilter = filter.trim();
  const hasMatches = visible.length > 0;

  function onKeyDown(e: React.KeyboardEvent) {
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
      }
    }
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: forwards arrow/enter keys from the filter input + menuitems; the wrapper is a layout div
    <div onKeyDown={onKeyDown}>
      <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
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
      <section aria-label="branch-list" className="max-h-80 overflow-y-auto border-t border-border">
        {hasMatches ? (
          visible.map((b, i) => {
            const isCurrent = b === current;
            const isCursor = i === cursor;
            return (
              <Popover.Close asChild key={b}>
                <button
                  type="button"
                  role="menuitem"
                  data-kind="branch"
                  data-cursor={isCursor || undefined}
                  onClick={() => onSelect(b)}
                  className={`flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm text-text hover:bg-white/5 ${
                    isCursor ? 'bg-white/5' : ''
                  }`}
                >
                  <span className="w-3 text-text-subtle">{isCurrent ? '✓' : ''}</span>
                  <span className="truncate">{b}</span>
                </button>
              </Popover.Close>
            );
          })
        ) : onCreateBranch ? (
          <Popover.Close asChild>
            <button
              type="button"
              role="menuitem"
              data-kind="create-from-filter"
              onClick={() => onCreateBranch(trimmedFilter)}
              className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-text-muted hover:text-text hover:bg-white/5"
            >
              <span className="w-3">+</span>
              <span>
                Create <span className="font-mono text-text">"{trimmedFilter}"</span> as new branch
              </span>
            </button>
          </Popover.Close>
        ) : (
          <div className="px-3 py-2 text-xs text-text-muted">No match</div>
        )}
      </section>
      {onCreateBranch && (
        <>
          <div className="my-1 border-t border-border" />
          <Popover.Close asChild>
            <button
              type="button"
              role="menuitem"
              data-kind="create-new"
              onClick={() => onCreateBranch()}
              className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm text-text-muted hover:text-text hover:bg-white/5"
            >
              <span className="w-3">+</span>
              <span>New branch (worktree)…</span>
            </button>
          </Popover.Close>
        </>
      )}
    </div>
  );
}
