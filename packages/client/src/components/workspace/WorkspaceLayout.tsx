import { FolderOpenIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { toast } from 'sonner';
import { CommandPaletteProvider, useCommandPalette } from '@/contexts/CommandPaletteContext';
import { useActiveCwd, useNavigationState } from '@/contexts/NavigationContext';
import { useProjectActions, useProjectState } from '@/contexts/ProjectContext';
import { useSession } from '@/contexts/SessionContext';
import { TabProvider } from '@/contexts/TabContext';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { cn } from '@/utils/cn';
import { CommandPalette } from '../palette/CommandPalette.tsx';
import { AddProjectDialog } from '../project/AddProjectDialog.tsx';
import { ProjectTree } from '../project/ProjectTree.tsx';
import { TopScopeSwitcher } from '../project/TopScopeSwitcher.tsx';
import { SettingsDialog } from '../settings/SettingsDialog.tsx';
import { DrawerAside } from './DrawerAside.tsx';
import { EmptyState } from './EmptyState.tsx';
import { RightPane } from './RightPane.tsx';
import { TabContainer } from './TabContainer.tsx';
import { WorkspaceTopbar } from './WorkspaceTopbar.tsx';

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
const NO_FORM = { enableOnFormTags: false, preventDefault: true } as const;

export function WorkspaceLayout(): React.JSX.Element {
  return (
    <CommandPaletteProvider>
      <WorkspaceLayoutInner />
    </CommandPaletteProvider>
  );
}

function formatAddProjectError(error: string, path: string | undefined, cwd: string): string {
  if (error === 'path_not_found') return `Path not found: ${path ?? cwd}`;
  if (error === 'path_not_directory') return `Not a directory: ${path ?? cwd}`;
  return `Could not add project (${error})`;
}

function WorkspaceLayoutInner() {
  const { openPalette, registerActions } = useCommandPalette();
  useHotkeys('mod+k', () => openPalette(), NO_FORM);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    registerActions({
      onAddProject: () => setDialogOpen(true),
      onOpenSettings: () => setSettingsOpen(true),
    });
  }, [registerActions]);
  const { projects, activeProjectCwd } = useProjectState();
  const { sessions, sessionsMap } = useSession();
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
      toast.error(formatAddProjectError(res.error, res.path, cwd));
      return;
    }
    setDialogOpen(false);
  }

  const hasCwd = activeProjectCwd !== null;
  const onToggleLeft = () => setLeftOpen((v) => !v);
  const onToggleRight = !hasCwd ? undefined : () => setRightOpen((v) => !v);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <CommandPalette />
      <DocumentTitle sessions={sessions} />
      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderOpenIcon className="w-10 h-10" />}
          message="No projects yet"
          actionLabel="Add Project"
          onAction={() => setDialogOpen(true)}
        />
      ) : (
        <>
          <WorkspaceTopbar
            mode={isMobile ? 'mobile' : 'desktop'}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenSearch={() => openPalette()}
            onToggleLeft={onToggleLeft}
            onToggleRight={onToggleRight}
            sessions={sessions}
            onActivateSession={(channelId) => {
              const s = sessionsMap.get(channelId);
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
          <div className="relative flex flex-1 overflow-hidden">
            {leftOpen && (
              <button
                type="button"
                aria-label="Dismiss sidebar"
                onClick={() => setLeftOpen(false)}
                className="lg:hidden fixed inset-0 z-overlay bg-black/40"
              />
            )}
            {rightOpen && hasCwd && (
              <button
                type="button"
                aria-label="Dismiss right pane"
                onClick={() => setRightOpen(false)}
                className="lg:hidden fixed inset-0 z-overlay bg-black/40"
              />
            )}

            <DrawerAside
              side="left"
              open={leftOpen}
              mobileWidthClass="w-[min(85vw,320px)]"
              dockedWidthClass="lg:w-65"
              label="sidebar-panel"
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
                label="right-pane-drawer"
              >
                <RightPaneWithCwd />
              </DrawerAside>
            )}
          </div>
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
        <section
          key={project.cwd}
          aria-label={project.cwd === activeProjectCwd ? 'project-container' : undefined}
          className={cn(project.cwd === activeProjectCwd ? 'flex flex-1 min-w-0 h-full' : 'hidden')}
        >
          <TabProvider
            sessions={sessions.filter((s) => s.projectRoot === project.cwd)}
            cwd={project.cwd}
            selectedCwd={selectedWorktreeCwd[project.cwd] ?? undefined}
          >
            <TabContainer projectCwd={project.cwd} />
          </TabProvider>
        </section>
      ))}
    </div>
  );
}

function RightPaneWithCwd() {
  const cwd = useActiveCwd();
  if (!cwd) return null;
  return (
    <RightPane
      cwd={cwd}
      onMention={(path) => {
        toast(`Mention queued: ${path}`);
      }}
    />
  );
}
