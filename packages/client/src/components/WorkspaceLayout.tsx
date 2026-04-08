import type { ReactNode } from 'react';
import { useState } from 'react';
import { useProjectActions, useProjectState } from '../contexts/ProjectContext';
import { TabProvider } from '../contexts/TabContext';
import { useSessionSync } from '../hooks/useSessionSync';
import { ActivityBar } from './ActivityBar';
import { AddProjectDialog } from './AddProjectDialog';
import { EditorArea } from './EditorArea';
import { ProjectList } from './ProjectList';

const SIDEBAR_ITEMS = [{ id: 'projects', icon: '📋', title: 'Projects' }];
const SIDEBAR_WIDTH = 260;

function ProjectTabProvider({ cwd, children }: { cwd: string; children: ReactNode }) {
  return (
    <TabProvider defaultCwd={cwd}>
      <SessionSyncBridge cwd={cwd} />
      {children}
    </TabProvider>
  );
}

function SessionSyncBridge({ cwd }: { cwd?: string }) {
  useSessionSync(cwd);
  return null;
}

export function WorkspaceLayout() {
  const [activePanel, setActivePanel] = useState<string | null>('projects');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { projects, activeProjectCwd } = useProjectState();
  const { addProject, setActiveProject } = useProjectActions();

  function handleAddProject(cwd: string) {
    addProject(cwd);
    setDialogOpen(false);
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
            onSelect={setActiveProject}
            onAdd={() => setDialogOpen(true)}
          />
        </div>
      )}
      <div className="flex-1 min-w-0 flex h-full">
        {projects.map((project) => (
          <div
            key={project.cwd}
            className={project.cwd === activeProjectCwd ? 'flex flex-1' : 'hidden'}
          >
            <ProjectTabProvider cwd={project.cwd}>
              <EditorArea />
            </ProjectTabProvider>
          </div>
        ))}
        {projects.length === 0 && <EditorArea />}
      </div>
      <AddProjectDialog
        open={dialogOpen}
        onSelect={handleAddProject}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
