import { FolderOpenIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ActiveChatTabCwdProvider } from '../contexts/ActiveChatTabCwdContext';
import { useNavigationState } from '../contexts/NavigationContext';
import { useProjectActions, useProjectState } from '../contexts/ProjectContext';
import { RightPaneScopeProvider } from '../contexts/RightPaneScopeContext';
import { useSession } from '../contexts/SessionContext';
import { TabProvider } from '../contexts/TabContext';
import { useActiveCwd } from '../hooks/useActiveCwd';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { cn } from '../utils/cn';
import { AddProjectDialog } from './AddProjectDialog';
import { DrawerAside } from './DrawerAside';
import { EmptyState } from './EmptyState';
import { ProjectTree } from './ProjectTree';
import { RightPane } from './RightPane';
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

/**
 * Workspace shell — single component tree across all viewport widths. The
 * sidebar and right pane are mounted exactly once each; CSS responsive
 * modifiers decide whether they appear as docked columns (lg+) or as
 * fixed-positioned slide-in drawers (<lg). This preserves component-local
 * state (file-tree expansion, scroll, draft text, etc.) when the user
 * resizes across the 768/1024 breakpoints.
 *
 * Resize-to-taste of the sidebar / right-pane widths is intentionally
 * deferred — the previous react-resizable-panels integration was the
 * source of the breakpoint-state-loss bug because Panels can't be both a
 * docked column and a fixed-positioned drawer.
 */
export function WorkspaceLayout() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { projects, activeProjectCwd } = useProjectState();
  const { sessions } = useSession();
  const { addProject, setActiveProject } = useProjectActions();
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'mobile';

  // One toggle per pane, semantics differ by breakpoint:
  //   lg+:  open=true → docked column visible; open=false → collapsed (width 0)
  //   <lg:  open=true → drawer slid in;        open=false → drawer slid out
  // The two semantics flip meaning on resize, so we re-sync to the
  // breakpoint default whenever it changes — otherwise a desktop-open
  // sidebar becomes a content-blocking mobile drawer the instant the
  // window narrows.
  const [leftOpen, setLeftOpen] = useState(() => breakpoint === 'desktop');
  const [rightOpen, setRightOpen] = useState(() => breakpoint === 'desktop');
  useEffect(() => {
    const isDesktop = breakpoint === 'desktop';
    setLeftOpen(isDesktop);
    setRightOpen(isDesktop);
  }, [breakpoint]);

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

  const hasCwd = activeProjectCwd !== null;
  const onToggleLeft = () => setLeftOpen((v) => !v);
  const onToggleRight = !hasCwd ? undefined : () => setRightOpen((v) => !v);

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
            onToggleLeft={onToggleLeft}
            onToggleRight={onToggleRight}
            sessions={sessions}
            onActivateSession={(channelId) => {
              const s = sessions.find((x) => x.channelId === channelId);
              if (s) setActiveProject(s.projectRoot);
            }}
          >
            <TopScopeSwitcher
              projects={projects}
              activeProjectCwd={activeProjectCwd}
              onSelect={setActiveProject}
              onAddProject={() => setDialogOpen(true)}
            />
          </WorkspaceTopbar>
          <ActiveChatTabCwdProvider>
            <div className="relative flex flex-1 overflow-hidden">
              {leftOpen && (
                <button
                  type="button"
                  aria-label="Dismiss sidebar"
                  data-testid="sidebar-backdrop"
                  onClick={() => setLeftOpen(false)}
                  className="lg:hidden fixed inset-0 z-overlay bg-black/40"
                />
              )}
              {rightOpen && hasCwd && (
                <button
                  type="button"
                  aria-label="Dismiss right pane"
                  data-testid="right-pane-backdrop"
                  onClick={() => setRightOpen(false)}
                  className="lg:hidden fixed inset-0 z-overlay bg-black/40"
                />
              )}

              <DrawerAside
                side="left"
                open={leftOpen}
                mobileWidthClass="w-[min(85vw,320px)]"
                dockedWidthClass="lg:w-65"
                testId="sidebar-panel"
              >
                <ProjectTree
                  projects={projects}
                  activeProjectCwd={activeProjectCwd}
                  onSelectProject={(cwd) => {
                    setActiveProject(cwd);
                    if (breakpoint !== 'desktop') setLeftOpen(false);
                  }}
                  onAdd={() => setDialogOpen(true)}
                />
              </DrawerAside>

              <main className="flex flex-1 min-w-0 h-full">
                <ProjectsTabContainer
                  projects={projects}
                  activeProjectCwd={activeProjectCwd}
                  sessions={sessions}
                />
              </main>

              {hasCwd && (
                <DrawerAside
                  side="right"
                  open={rightOpen}
                  mobileWidthClass="w-[min(85vw,360px)]"
                  dockedWidthClass="lg:w-80"
                  testId="right-pane-drawer"
                >
                  <RightPaneWithCwd
                    onCollapse={() => setRightOpen(false)}
                    onBack={() => setRightOpen(false)}
                    isMobile={isMobile}
                  />
                </DrawerAside>
              )}
            </div>
          </ActiveChatTabCwdProvider>
        </>
      )}
      <AddProjectDialog
        open={dialogOpen}
        onSelect={handleAddProject}
        onClose={() => setDialogOpen(false)}
        addedProjectCwds={new Set(projects.map((p) => p.cwd))}
      />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

function ProjectsTabContainer({
  projects,
  activeProjectCwd,
  sessions,
}: {
  projects: ReturnType<typeof useProjectState>['projects'];
  activeProjectCwd: string | null;
  sessions: ReturnType<typeof useSession>['sessions'];
}) {
  const { selectedWorktreeCwd } = useNavigationState();
  return (
    <div className="flex flex-1 min-w-0 h-full">
      {projects.map((project) => (
        <div
          key={project.cwd}
          data-testid={project.cwd === activeProjectCwd ? 'project-container' : undefined}
          className={cn(project.cwd === activeProjectCwd ? 'flex flex-1 min-w-0 h-full' : 'hidden')}
        >
          <TabProvider
            sessions={sessions.filter((s) => s.projectRoot === project.cwd)}
            cwd={project.cwd}
            selectedCwd={selectedWorktreeCwd[project.cwd] ?? undefined}
          >
            <TabContainer projectCwd={project.cwd} />
          </TabProvider>
        </div>
      ))}
    </div>
  );
}

function RightPaneWithCwd({
  onCollapse,
  onBack,
  isMobile,
}: {
  onCollapse: () => void;
  onBack: () => void;
  isMobile: boolean;
}) {
  const activeCwd = useActiveCwd();
  return (
    <RightPaneScopeProvider activeCwd={activeCwd}>
      <RightPane
        closeMode={isMobile ? 'back' : 'collapse'}
        onCollapse={onCollapse}
        onBack={onBack}
        onMention={(path) => {
          toast(`Mention queued: ${path}`);
        }}
      />
    </RightPaneScopeProvider>
  );
}
