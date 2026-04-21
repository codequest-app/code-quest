import { Bars3Icon, FolderOpenIcon, RectangleStackIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { useProjectActions, useProjectState } from '../contexts/ProjectContext';
import { TabProvider } from '../contexts/TabContext';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { cn } from '../utils/cn';
import { ActivityBar } from './ActivityBar';
import { AddProjectDialog } from './AddProjectDialog';
import { EditorArea } from './EditorArea';
import { EmptyState } from './EmptyState';
import { ProjectList } from './ProjectList';
import { SettingsDialog } from './SettingsDialog';

const SIDEBAR_ITEMS = [
  {
    id: 'projects',
    icon: <RectangleStackIcon className="w-5 h-5" />,
    title: 'Projects',
  },
];

function DocumentTitle({ sessions }: { sessions: Array<{ state: string }> }) {
  const isBusy = sessions.some((s) => s.state === 'busy');
  useEffect(() => {
    document.title = isBusy ? '⟳ Code Quest' : 'Code Quest';
  }, [isBusy]);
  return null;
}

const SIDEBAR_WIDTH = 260;

export function WorkspaceLayout() {
  const [activePanel, setActivePanel] = useState<string | null>('projects');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { projects, activeProjectCwd, sessions } = useProjectState();
  const { addProject, setActiveProject } = useProjectActions();
  const breakpoint = useBreakpoint();
  const isDesktop = breakpoint === 'desktop';
  const isMobile = breakpoint === 'mobile';

  function handleAddProject(cwd: string) {
    addProject(cwd);
    setDialogOpen(false);
  }

  function handleActivityBarToggle(panel: string | null) {
    if (isDesktop) {
      setActivePanel(panel);
    } else {
      setDrawerOpen((open) => !open);
    }
  }

  const sidebarVisible = isDesktop ? !!activePanel : drawerOpen;

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
          {isMobile && (
            <div
              data-testid="mobile-topbar"
              className="flex items-center h-11 px-3 border-b border-border bg-surface shrink-0"
            >
              <button
                type="button"
                aria-label="Menu"
                onClick={() => setDrawerOpen(true)}
                className="flex items-center justify-center w-8 h-8 rounded text-text-muted hover:text-text hover:bg-white/5"
              >
                <Bars3Icon className="w-5 h-5" />
              </button>
            </div>
          )}
          <div className="flex flex-1 overflow-hidden">
            {!isMobile && (
              <ActivityBar
                items={SIDEBAR_ITEMS}
                activePanel={isDesktop ? activePanel : drawerOpen ? 'projects' : null}
                onToggle={handleActivityBarToggle}
                onOpenSettings={() => setSettingsOpen(true)}
              />
            )}
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
                  <ProjectList
                    projects={projects}
                    activeProjectCwd={activeProjectCwd}
                    onSelect={(cwd) => {
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
                    <EditorArea />
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
