import { ClipboardDocumentListIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import * as Tabs from '@radix-ui/react-tabs';
import { useState } from 'react';
import { FilesPane } from './FilesPane';
import { GitPane } from './GitPane';
import { SpecPane } from './SpecPane';

type TabKind = 'files' | 'git' | 'spec';

interface TabSpec {
  key: TabKind;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabSpec[] = [
  { key: 'files', label: 'Files', icon: <DocumentTextIcon className="w-4 h-4" /> },
  // heroicons has no git-branch icon; reuse the ⎇ glyph used by GitPane's
  // branch badge so the visual cue is consistent across tab + pane.
  { key: 'git', label: 'Git', icon: <span aria-hidden>⎇</span> },
  { key: 'spec', label: 'Spec', icon: <ClipboardDocumentListIcon className="w-4 h-4" /> },
];

export interface RightPaneProps {
  cwd: string;
  onMention: (path: string) => void;
}

const TRIGGER_BASE =
  'flex-1 h-9 inline-flex items-center justify-center gap-1.5 text-xs border-b-2 border-transparent text-text-muted hover:text-text outline-none data-[state=active]:border-accent data-[state=active]:text-text';

/**
 * Right pane tab shell — Radix Tabs primitive (matches the rest of our
 * Radix-unified menus/dialogs). `forceMount` + the `mounted` set preserves
 * component-local state (FileTree expansion, scroll, selection) across
 * tab switches: each tab mounts lazily on first activation and stays
 * mounted (CSS-hidden when inactive) afterwards.
 */
export function RightPane({ cwd, onMention }: RightPaneProps) {
  const [active, setActive] = useState<TabKind>('files');
  const [mounted, setMounted] = useState<ReadonlySet<TabKind>>(() => new Set(['files']));

  function handleTabChange(value: string) {
    const next = value as TabKind;
    setActive(next);
    setMounted((prev) => (prev.has(next) ? prev : new Set([...prev, next])));
  }

  return (
    <Tabs.Root
      value={active}
      onValueChange={handleTabChange}
      className="flex flex-col h-full bg-surface"
    >
      <Tabs.List className="flex border-b border-border">
        {TABS.map(({ key, label, icon }) => (
          <Tabs.Trigger key={key} value={key} className={TRIGGER_BASE}>
            {icon}
            <span>{label}</span>
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      <div data-testid="right-pane-body" className="flex-1 min-h-0 flex flex-col" data-cwd={cwd}>
        <TabContent value="files" active={active === 'files'}>
          {mounted.has('files') && <FilesPane cwd={cwd} onMention={onMention} />}
        </TabContent>
        <TabContent value="git" active={active === 'git'}>
          {mounted.has('git') && <GitPane cwd={cwd} />}
        </TabContent>
        <TabContent value="spec" active={active === 'spec'}>
          {mounted.has('spec') && <SpecPane cwd={cwd} />}
        </TabContent>
      </div>
    </Tabs.Root>
  );
}

/** Wraps Radix `Tabs.Content` with `forceMount` so the subtree stays
 *  mounted when inactive. We set the HTML `hidden` attribute explicitly
 *  (Radix doesn't add it when forceMount is on). When active, drops to
 *  `display: contents` so it doesn't introduce an extra flex ancestor. */
function TabContent({
  value,
  active,
  children,
}: {
  value: TabKind;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tabs.Content
      value={value}
      forceMount
      hidden={!active}
      className={active ? 'contents' : undefined}
    >
      {children}
    </Tabs.Content>
  );
}
