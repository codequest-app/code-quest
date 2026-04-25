import * as Tabs from '@radix-ui/react-tabs';
import { Fragment, useState } from 'react';
import type { SessionStatus } from '../types/ui';
import { cn } from '../utils/cn';
import { Button } from './ui/Button';
import { Dialog, DialogClose, DialogContent } from './ui/Dialog';

export interface TabInfo {
  sessionId: string;
  title?: string;
  status: SessionStatus;
  /** Presence of `worktree` signals the tab runs inside a git worktree folder.
   *  `branch` is preferred for the badge label; `name` is fallback. */
  worktree?: { name: string; path: string; branch?: string };
  /** Project basename for the scope-tag (`projectName/branch`). */
  projectName?: string;
}

/** Group key: null for main-tree tabs, worktree name for worktree tabs.
 *  Main-tree sorts first because null < any string via the compare below. */
function tabGroupKey(tab: TabInfo): string | null {
  return tab.worktree?.name ?? null;
}

function compareGroup(a: TabInfo, b: TabInfo): number {
  const ka = tabGroupKey(a);
  const kb = tabGroupKey(b);
  if (ka === kb) return 0;
  if (ka === null) return -1;
  if (kb === null) return 1;
  return ka.localeCompare(kb);
}

interface TabBarProps {
  tabs: TabInfo[];
  activeTabId: string | null;
  onSelectTab: (sessionId: string) => void;
  onCloseTab: (sessionId: string) => void;
  onNewTab?: () => void;
  onOpenHistory?: () => void;
}

const statusDot: Record<SessionStatus, string> = {
  disconnected: 'bg-danger',
  idle: 'bg-success',
  processing: 'bg-accent animate-pulse',
  connecting: 'bg-accent animate-pulse',
  busy: 'bg-accent animate-pulse',
  cancelling: 'bg-warning animate-pulse',
};

/** Renders the chat tab strip via Radix `Tabs.List` + `Tabs.Trigger`.
 *  MUST be rendered inside a `<Tabs.Root>` (provided by TabContainer) —
 *  the Root carries the controlled `value` ↔ `setActiveTab` wiring and
 *  scopes the trigger ↔ content collection used by Radix for keyboard
 *  navigation and `Tabs.Content forceMount` body slots.
 *
 *  Triggers use `asChild` to render `<div role="tab">` instead of the
 *  default `<button>`, so the per-tab close `<button>` can remain nested
 *  without violating button-in-button. Radix still applies `role`,
 *  `tabindex` (roving), `aria-selected`, click activation, and Arrow /
 *  Home / End keyboard nav. */
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

  const sortedTabs = [...tabs].sort(compareGroup);

  return (
    <Tabs.List asChild>
      <div
        className="flex items-center h-9 border-b border-border overflow-x-auto"
        data-testid="tab-bar"
      >
        {sortedTabs.map((tab, i) => {
          const prev = i > 0 ? sortedTabs[i - 1] : null;
          const showDivider = prev !== null && tabGroupKey(prev) !== tabGroupKey(tab);
          return (
            <Fragment key={tab.sessionId}>
              {showDivider ? (
                <span data-testid="tab-divider" className="h-5 border-l border-border mx-1" />
              ) : null}
              <Tabs.Trigger value={tab.sessionId} asChild>
                {/* biome-ignore lint/a11y/noStaticElementInteractions: Radix Tabs.Trigger
                    injects role="tab" + keyboard nav via Slot at runtime.
                    biome-ignore lint/a11y/useKeyWithClickEvents: same — Radix supplies
                    onMouseDown / Enter / Space activation. */}
                <div
                  className={cn(
                    'flex items-center gap-2 px-3 h-full text-xs cursor-pointer shrink-0',
                    'border-r border-border border-b-2 border-b-transparent',
                    tab.sessionId === activeTabId
                      ? 'text-text-bright bg-bg border-b-accent'
                      : 'text-text-muted hover:text-text hover:bg-white/5',
                  )}
                  onClick={() => onSelectTab(tab.sessionId)}
                  title={tab.worktree?.path}
                >
                  <span className={cn('w-1.5 h-1.5 rounded-full', statusDot[tab.status])} />
                  <span className="truncate max-w-30">
                    {tab.title || tab.sessionId.slice(0, 8)}
                  </span>
                  {tab.worktree && tab.projectName ? (
                    <span
                      data-testid="tab-scope-tag"
                      className="font-mono text-text-subtle"
                      style={{ fontSize: '10px' }}
                    >
                      {tab.projectName}/{tab.worktree.branch ?? tab.worktree.name}
                    </span>
                  ) : null}
                  {/* Provider pill slot reserved for future multi-CLI feature.
                      Empty placeholder — see spec/chat-tabs Requirement: Provider pill slot. */}
                  <span data-provider-slot="" />
                  <button
                    type="button"
                    className="ml-1 text-text-subtle hover:text-danger hover:bg-danger/10 px-0.5 rounded text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmingId(tab.sessionId);
                    }}
                    aria-label={`Close ${tab.title || tab.sessionId}`}
                  >
                    ×
                  </button>
                </div>
              </Tabs.Trigger>
            </Fragment>
          );
        })}
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
            aria-label="Session history"
            title="Session history"
          >
            ☰
          </button>
        )}
        <Dialog
          open={confirmingId !== null}
          onOpenChange={(open) => {
            if (!open) setConfirmingId(null);
          }}
        >
          <DialogContent title="Close Session">
            <p className="text-sm text-text-muted mb-4">
              Are you sure you want to close this session? The CLI process will be terminated.
            </p>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="ghost" size="md">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                variant="danger"
                size="md"
                onClick={() => {
                  if (confirmingId) onCloseTab(confirmingId);
                  setConfirmingId(null);
                }}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Tabs.List>
  );
}
