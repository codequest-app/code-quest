import { ClipboardDocumentListIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import * as Tabs from '@radix-ui/react-tabs';
import { useState } from 'react';
import { useRightPaneCwd } from '../contexts/RightPaneScopeContext';
import { FilesPane } from './FilesPane';
import { GitPane } from './GitPane';
import { RightPanePaneBar } from './RightPanePaneBar';
import { SpecPane } from './SpecPane';

type TabKind = 'files' | 'git' | 'spec';

interface TabSpec {
  key: TabKind;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabSpec[] = [
  { key: 'files', label: 'Files', icon: <DocumentTextIcon className="w-4 h-4" /> },
  { key: 'git', label: 'Git', icon: <span aria-hidden>⎇</span> },
  { key: 'spec', label: 'Spec', icon: <ClipboardDocumentListIcon className="w-4 h-4" /> },
];

export interface RightPaneProps {
  closeMode: 'collapse' | 'back';
  onClose?: () => void;
  onMention: (path: string) => void;
}

const TRIGGER_BASE =
  'flex-1 h-9 inline-flex items-center justify-center gap-1.5 text-xs border-b-2 border-transparent text-text-muted hover:text-text outline-none data-[state=active]:border-accent data-[state=active]:text-text';

export function RightPane({ closeMode, onClose, onMention }: RightPaneProps) {
  const cwd = useRightPaneCwd();
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
      <RightPanePaneBar closeMode={closeMode} onClose={onClose} />
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
          {mounted.has('files') && cwd && <FilesPane cwd={cwd} onMention={onMention} />}
        </TabContent>
        <TabContent value="git" active={active === 'git'}>
          {mounted.has('git') && cwd && <GitPane cwd={cwd} />}
        </TabContent>
        <TabContent value="spec" active={active === 'spec'}>
          {mounted.has('spec') && cwd && <SpecPane cwd={cwd} />}
        </TabContent>
      </div>
    </Tabs.Root>
  );
}

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
