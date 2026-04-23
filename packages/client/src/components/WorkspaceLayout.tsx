import { FolderOpenIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useProjectActions, useProjectState } from '../contexts/ProjectContext';
import { useSession } from '../contexts/SessionContext';
import { TabProvider } from '../contexts/TabContext';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { cn } from '../utils/cn';
import { AddProjectDialog } from './AddProjectDialog';
import { EmptyState } from './EmptyState';
import { ProjectTree } from './ProjectTree';
import { SettingsDialog } from './SettingsDialog';
import { TabContainer } from './TabContainer';
import { TopScopeSwitcher } from './TopScopeSwitcher';
import { WorkspaceTopbar } from './WorkspaceTopbar';

function DocumentTitle({ sessions }: { sessions: Array<{ state: string }> }) {
  const isBusy = sessions.some((s) => s.state === 'busy');
  useEffect(() => {
    document.title = isBusy ? '⟳ Code Quest' : 'Code Quest';
  }, [isBusy]);
  return null;
}

const SIDEBAR_WIDTH = 260;

export function WorkspaceLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { projects, activeProjectCwd } = useProjectState();
  const { sessions } = useSession();
  const { addProject, setActiveProject } = useProjectActions();
  const breakpoint = useBreakpoint();
  const isDesktop = breakpoint === 'desktop';
  const isMobile = breakpoint === 'mobile';

  async function handleAddProject(cwd: string) {
    const res = await addProject(cwd);
    if ('error' in res) {
      const msg =
        res.error === 'path_not_found'
          ? `Path not found: ${res.path ?? cwd}`
          : res.error === 'path_not_directory'
            ? `Not a directory: ${res.path ?? cwd}`
            : `Could not add project (${res.error})`;
      toast.error(msg);
      return;
    }
    setDialogOpen(false);
  }

  // Sidebar is always visible on desktop; on tablet/mobile it's an overlay drawer.
  const sidebarVisible = isDesktop || drawerOpen;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <DocumentTitle sessions={sessions} />
      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderOpenIcon className="w-10 h-10" />}
          message="No projects yet"
          actionLabel="Add Project"
          onAction={() => setDialogOpen(true)}
          testId="empty-add-project"
        />
      ) : (
        <>
          <WorkspaceTopbar
            mode={isMobile ? 'mobile' : 'desktop'}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenMenu={isDesktop ? undefined : () => setDrawerOpen(true)}
          >
            <TopScopeSwitcher
              projects={projects}
              activeProjectCwd={activeProjectCwd}
              onSelect={setActiveProject}
              onAddProject={() => setDialogOpen(true)}
            />
          </WorkspaceTopbar>
          <div className="flex flex-1 overflow-hidden">
            {sidebarVisible && (
              <>
                {!isDesktop && (
                  <button
                    type="button"
                    data-testid="sidebar-backdrop"
                    className="fixed inset-0 z-overlay bg-black/40 cursor-default"
                    onClick={() => setDrawerOpen(false)}
                    onKeyDown={(e) => e.key === 'Escape' && setDrawerOpen(false)}
                  />
                )}
                <div
                  className={cn(
                    'h-full overflow-auto border-r border-border bg-surface shrink-0',
                    !isDesktop && 'fixed top-0 left-0 z-modal animate-slide-in-from-left',
                  )}
                  style={{ width: SIDEBAR_WIDTH }}
                  data-testid="sidebar-panel"
                >
                  <ProjectTree
                    projects={projects}
                    activeProjectCwd={activeProjectCwd}
                    onSelectProject={(cwd) => {
                      setActiveProject(cwd);
                      if (!isDesktop) setDrawerOpen(false);
                    }}
                    onAdd={() => setDialogOpen(true)}
                  />
                </div>
              </>
            )}
            <div className="flex flex-1 min-w-0">
              {projects.map((project) => (
                <div
                  key={project.cwd}
                  data-testid={project.cwd === activeProjectCwd ? 'project-container' : undefined}
                  className={cn(
                    project.cwd === activeProjectCwd ? 'flex flex-1 min-w-0' : 'hidden',
                  )}
                >
                  <TabProvider
                    sessions={sessions.filter((s) => s.projectRoot === project.cwd)}
                    cwd={project.cwd}
                  >
                    <TabContainer />
                  </TabProvider>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      <AddProjectDialog
        open={dialogOpen}
        onSelect={handleAddProject}
        onClose={() => setDialogOpen(false)}
      />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
