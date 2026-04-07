import { useState } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { ActivityBar } from './ActivityBar';
import { EditorArea } from './EditorArea';

const SIDEBAR_ITEMS = [{ id: 'explorer', icon: '📁', title: 'Explorer' }];

export function WorkspaceLayout() {
  const [activePanel, setActivePanel] = useState<string | null>(null);

  return (
    <div className="flex flex-1 overflow-hidden">
      <ActivityBar items={SIDEBAR_ITEMS} activePanel={activePanel} onToggle={setActivePanel} />
      <Group orientation="horizontal">
        {activePanel && (
          <>
            <Panel
              defaultSize={20}
              minSize={15}
              maxSize={40}
              collapsible
              data-testid="sidebar-panel"
            >
              <div className="h-full overflow-auto border-r border-border bg-surface">
                {activePanel === 'explorer' && (
                  <div className="p-2 text-xs text-text-muted">Explorer (placeholder)</div>
                )}
              </div>
            </Panel>
            <Separator className="w-1 hover:bg-accent/50 transition-colors" />
          </>
        )}
        <Panel>
          <EditorArea />
        </Panel>
      </Group>
    </div>
  );
}
