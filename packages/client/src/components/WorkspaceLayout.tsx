import { useEffect, useState } from 'react';
import { useProjectActions, useProjectState } from '../contexts/ProjectContext';
import { TabProvider } from '../contexts/TabContext';
import { ActivityBar } from './ActivityBar';
import { AddProjectDialog } from './AddProjectDialog';
import { EditorArea } from './EditorArea';
import { EmptyState } from './EmptyState';
import { ProjectList } from './ProjectList';

const SIDEBAR_ITEMS = [{ id: 'projects', icon: '📋', title: 'Projects' }];
const BUSY_STATES = new Set(['busy']);

function DocumentTitle({ sessions }: { sessions: Array<{ state: string }> }) {
  const isBusy = sessions.some((s) => BUSY_STATES.has(s.state));
  useEffect(() => {
    document.title = isBusy ? '⟳ Code Quest' : 'Code Quest';
  }, [isBusy]);
  return null;
}
const SIDEBAR_WIDTH = 260;

export function WorkspaceLayout({ defaultCwd }: { defaultCwd?: string }) {
  const [activePanel, setActivePanel] = useState<string | null>('projects');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { projects, activeProjectCwd, sessions } = useProjectState();
  const { addProject, setActiveProject } = useProjectActions();

  function handleAddProject(cwd: string) {
    addProject(cwd);
    setDialogOpen(false);
  }

  function handleNewTab() {
    if (defaultCwd) {
      addProject(defaultCwd);
    }
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <DocumentTitle sessions={sessions} />
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
            <TabProvider sessions={sessions.filter((s) => s.cwd === project.cwd)} cwd={project.cwd}>
              <EditorArea />
            </TabProvider>
          </div>
        ))}
        {projects.length === 0 && <EmptyState onNewTab={handleNewTab} />}
      </div>
      <AddProjectDialog
        open={dialogOpen}
        onSelect={handleAddProject}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
