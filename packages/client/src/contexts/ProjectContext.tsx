import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { useSocket } from './SocketContext';
import { useTabActions, useTabState } from './TabContext';

export interface Project {
  cwd: string;
  name: string;
}

interface ProjectState {
  projects: Project[];
  activeProjectCwd: string | null;
}

interface ProjectActions {
  addProject: (cwd: string) => void;
  setActiveProject: (cwd: string) => void;
}

const ProjectStateContext = createContext<ProjectState | null>(null);
const ProjectActionsContext = createContext<ProjectActions | null>(null);

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

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectCwd, setActiveProjectCwd] = useState<string | null>(null);
  const { createNewTab, setActiveTab } = useTabActions();
  const { activeTabId } = useTabState();
  const { socket } = useSocket();
  const activeTabPerProject = useRef<Map<string, string>>(new Map());

  // Derive projects from session:states
  useEffect(() => {
    const fn = (payload: { sessions?: Array<{ channelId: string; cwd?: string }> }) => {
      if (!payload.sessions) return;
      const cwds = new Set<string>();
      for (const s of payload.sessions) {
        if (s.cwd) cwds.add(s.cwd);
      }
      if (cwds.size === 0) return;
      setProjects((prev) => {
        const existing = new Set(prev.map((p) => p.cwd));
        const newProjects = [...cwds].filter((c) => !existing.has(c)).map(cwdToProject);
        return newProjects.length > 0 ? [...prev, ...newProjects] : prev;
      });
    };
    socket.on('session:states', fn);
    return () => {
      socket.off('session:states', fn);
    };
  }, [socket]);

  function addProject(cwd: string) {
    setProjects((prev) => {
      if (prev.some((p) => p.cwd === cwd)) return prev;
      return [...prev, cwdToProject(cwd)];
    });
    setActiveProjectCwd(cwd);
    createNewTab({ cwd });
  }

  function setActiveProject(cwd: string) {
    // Save current project's active tab
    if (activeProjectCwd && activeTabId) {
      activeTabPerProject.current.set(activeProjectCwd, activeTabId);
    }
    setActiveProjectCwd(cwd);
    // Restore saved active tab for target project
    const savedTab = activeTabPerProject.current.get(cwd);
    if (savedTab) {
      setActiveTab(savedTab);
    }
  }

  const state: ProjectState = { projects, activeProjectCwd };
  const actions: ProjectActions = { addProject, setActiveProject };

  return (
    <ProjectStateContext.Provider value={state}>
      <ProjectActionsContext.Provider value={actions}>{children}</ProjectActionsContext.Provider>
    </ProjectStateContext.Provider>
  );
}
