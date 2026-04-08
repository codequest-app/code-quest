import { useRef, useState } from 'react';
import { useProjectActions, useProjectState } from '../contexts/ProjectContext';
import { useTabActions, useTabState } from '../contexts/TabContext';
import { ActivityBar } from './ActivityBar';
import { AddProjectDialog } from './AddProjectDialog';
import { EditorArea } from './EditorArea';
import { ProjectList } from './ProjectList';

const SIDEBAR_ITEMS = [{ id: 'projects', icon: '📋', title: 'Projects' }];
const SIDEBAR_WIDTH = 260;

export function WorkspaceLayout() {
  const [activePanel, setActivePanel] = useState<string | null>('projects');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { projects, activeProjectCwd } = useProjectState();
  const { addProject, setActiveProject } = useProjectActions();
  const { createNewTab, setActiveTab } = useTabActions();
  const { activeTabId } = useTabState();
  const savedTabs = useRef<Map<string, string>>(new Map());

  function handleAddProject(cwd: string) {
    addProject(cwd);
    createNewTab({ cwd });
    setDialogOpen(false);
  }

  function handleSwitchProject(cwd: string) {
    if (activeProjectCwd && activeTabId) {
      savedTabs.current.set(activeProjectCwd, activeTabId);
    }
    setActiveProject(cwd);
    const saved = savedTabs.current.get(cwd);
    if (saved) setActiveTab(saved);
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <ActivityBar items={SIDEBAR_ITEMS} activePanel={activePanel} onToggle={setActivePanel} />
      {activePanel && (
        <div
          className="h-full overflow-auto border-r border-border bg-surface shrink-0"
          style={{ width: SIDEBAR_WIDTH }}
          data-testid="sidebar-panel"
        >
          <ProjectList
            projects={projects}
            activeProjectCwd={activeProjectCwd}
            onSelect={handleSwitchProject}
            onAdd={() => setDialogOpen(true)}
          />
        </div>
      )}
      <div className="flex-1 min-w-0 flex">
        <EditorArea />
      </div>
      <AddProjectDialog
        open={dialogOpen}
        onSelect={handleAddProject}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
