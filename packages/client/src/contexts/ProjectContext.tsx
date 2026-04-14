import type { SessionStateSummary } from '@code-quest/shared';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { useSession } from './SessionContext';

export interface Project {
  cwd: string;
  name: string;
}

interface ProjectState {
  projects: Project[];
  activeProjectCwd: string | null;
  sessions: SessionStateSummary[];
  /** Server capabilities from app:init. Consumed by WorktreeProvider etc. */
  capabilities: { worktree: boolean };
  /** When set, a TabProvider whose cwd matches will activate the channelId once it appears in tabs. */
  pendingActivateChannel: { cwd: string; channelId: string } | null;
}

interface ProjectActions {
  addProject: (cwd: string) => void;
  setActiveProject: (cwd: string) => void;
  requestActivateChannel: (cwd: string, channelId: string) => void;
  clearPendingActivate: () => void;
}

export const ProjectStateContext = createContext<ProjectState | null>(null);
export const ProjectActionsContext = createContext<ProjectActions | null>(null);

export function useProjectState(): ProjectState {
  const ctx = useContext(ProjectStateContext);
  if (!ctx) throw new Error('useProjectState must be used within a ProjectProvider');
  return ctx;
}

export function useProjectActions(): ProjectActions {
  const ctx = useContext(ProjectActionsContext);
  if (!ctx) throw new Error('useProjectActions must be used within a ProjectProvider');
  return ctx;
}

function cwdToProject(cwd: string): Project {
  return { cwd, name: cwd.split('/').pop() ?? cwd };
}

const TERMINAL_STATES = new Set(['exited', 'disconnected']);

/** Project identity = projectRoot (server guarantees non-null: git root or cwd fallback). */
export function deriveProjects(sessions: SessionStateSummary[], prev: Project[]): Project[] {
  const keys = new Set<string>();
  for (const s of sessions) {
    if (!TERMINAL_STATES.has(s.state)) keys.add(s.projectRoot);
  }
  if (keys.size === 0) return prev;
  const existing = new Set(prev.map((p) => p.cwd));
  const newProjects = [...keys].filter((k) => !existing.has(k)).map(cwdToProject);
  return newProjects.length > 0 ? [...prev, ...newProjects] : prev;
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { sessions, capabilities } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectCwd, setActiveProjectCwd] = useState<string | null>(null);
  const [pendingActivateChannel, setPendingActivateChannel] = useState<{
    cwd: string;
    channelId: string;
  } | null>(null);

  // Sync derived projects whenever the session list changes.
  useEffect(() => {
    setProjects((prev) => deriveProjects(sessions, prev));
  }, [sessions]);

  // Actions close only over stable setState refs — keep the same object
  // identity across renders so consumers (esp. TabProvider's
  // pendingActivateChannel effect) can safely include `projectActions` in
  // their dep arrays without re-firing on every ProjectProvider render.
  const [actions] = useState<ProjectActions>(() => ({
    addProject: (cwd: string) => {
      setProjects((prev) => {
        if (prev.some((p) => p.cwd === cwd)) return prev;
        return [...prev, cwdToProject(cwd)];
      });
      setActiveProjectCwd(cwd);
    },
    setActiveProject: (cwd: string) => setActiveProjectCwd(cwd),
    requestActivateChannel: (cwd: string, channelId: string) =>
      setPendingActivateChannel({ cwd, channelId }),
    clearPendingActivate: () => setPendingActivateChannel(null),
  }));

  const state: ProjectState = {
    projects,
    activeProjectCwd,
    sessions,
    capabilities,
    pendingActivateChannel,
  };
  return (
    <ProjectStateContext.Provider value={state}>
      <ProjectActionsContext.Provider value={actions}>{children}</ProjectActionsContext.Provider>
    </ProjectStateContext.Provider>
  );
}
