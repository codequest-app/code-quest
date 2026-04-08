import type { SessionStateSummary } from '@code-quest/shared';
import {
  initResponseSchema,
  sessionCreatedPayloadSchema,
  sessionDeadPayloadSchema,
  sessionStatesPayloadSchema,
} from '@code-quest/shared';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { useSocket } from './SocketContext';

export interface Project {
  cwd: string;
  name: string;
}

interface ProjectState {
  projects: Project[];
  activeProjectCwd: string | null;
  sessions: SessionStateSummary[];
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

function deriveProjects(sessions: SessionStateSummary[], prev: Project[]): Project[] {
  const cwds = new Set<string>();
  for (const s of sessions) {
    if (s.cwd) cwds.add(s.cwd);
  }
  if (cwds.size === 0) return prev;
  const existing = new Set(prev.map((p) => p.cwd));
  const newProjects = [...cwds].filter((c) => !existing.has(c)).map(cwdToProject);
  return newProjects.length > 0 ? [...prev, ...newProjects] : prev;
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectCwd, setActiveProjectCwd] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionStateSummary[]>([]);
  const { socket } = useSocket();

  // Listen to socket events → update sessions + derive projects
  useEffect(() => {
    const onConnect = () => {
      socket.emit('app:init', (raw) => {
        const parsed = initResponseSchema.safeParse(raw);
        if (!parsed.success) return;
        setSessions(parsed.data.sessions);
        setProjects((prev) => deriveProjects(parsed.data.sessions, prev));
      });
    };

    const onCreated = (raw: unknown) => {
      const parsed = sessionCreatedPayloadSchema.safeParse(raw);
      if (!parsed.success) return;
      const { channelId, cwd } = parsed.data;
      setSessions((prev) => {
        if (prev.some((s) => s.channelId === channelId)) return prev;
        return [...prev, { channelId, state: 'launching', cwd }];
      });
    };

    const onDead = (raw: unknown) => {
      const parsed = sessionDeadPayloadSchema.safeParse(raw);
      if (!parsed.success) return;
      setSessions((prev) => prev.filter((s) => s.channelId !== parsed.data.channelId));
    };

    const onStates = (raw: unknown) => {
      const parsed = sessionStatesPayloadSchema.safeParse(raw);
      if (!parsed.success) return;
      setSessions((prev) => {
        let next = [...prev];
        for (const update of parsed.data.sessions) {
          const idx = next.findIndex((s) => s.channelId === update.channelId);
          if (idx >= 0) {
            next[idx] = { ...next[idx], ...update };
          } else {
            next = [...next, update];
          }
        }
        return next;
      });
    };

    socket.on('connect', onConnect);
    if (socket.connected) onConnect();
    socket.on('session:created', onCreated);
    socket.on('session:dead', onDead);
    socket.on('session:states', onStates);
    return () => {
      socket.off('connect', onConnect);
      socket.off('session:created', onCreated);
      socket.off('session:dead', onDead);
      socket.off('session:states', onStates);
    };
  }, [socket]);

  function addProject(cwd: string) {
    setProjects((prev) => {
      if (prev.some((p) => p.cwd === cwd)) return prev;
      return [...prev, cwdToProject(cwd)];
    });
    setActiveProjectCwd(cwd);
  }

  function setActiveProject(cwd: string) {
    setActiveProjectCwd(cwd);
  }

  const state: ProjectState = { projects, activeProjectCwd, sessions };
  const actions: ProjectActions = { addProject, setActiveProject };

  return (
    <ProjectStateContext.Provider value={state}>
      <ProjectActionsContext.Provider value={actions}>{children}</ProjectActionsContext.Provider>
    </ProjectStateContext.Provider>
  );
}
