import type { SessionStateSummary } from '@code-quest/shared';
import {
  initResponseSchema,
  sessionCreatedPayloadSchema,
  sessionDeadPayloadSchema,
  sessionResumePayloadSchema,
  sessionStatesPayloadSchema,
} from '@code-quest/shared';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { useSession } from './SessionContext';
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

function handleCreated(
  raw: unknown,
  setSessions: React.Dispatch<React.SetStateAction<SessionStateSummary[]>>,
) {
  const parsed = sessionCreatedPayloadSchema.safeParse(raw);
  if (!parsed.success) return;
  const { channelId, cwd } = parsed.data;
  setSessions((prev) => {
    if (prev.some((s) => s.channelId === channelId)) return prev;
    return [...prev, { channelId, state: 'launching', cwd }];
  });
}

function handleDead(
  raw: unknown,
  setSessions: React.Dispatch<React.SetStateAction<SessionStateSummary[]>>,
) {
  const parsed = sessionDeadPayloadSchema.safeParse(raw);
  if (!parsed.success) return;
  setSessions((prev) => prev.filter((s) => s.channelId !== parsed.data.channelId));
}

function handleStates(
  raw: unknown,
  setSessions: React.Dispatch<React.SetStateAction<SessionStateSummary[]>>,
) {
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
}

function handleResume(
  raw: unknown,
  setSessions: React.Dispatch<React.SetStateAction<SessionStateSummary[]>>,
) {
  const parsed = sessionResumePayloadSchema.safeParse(raw);
  if (!parsed.success) return;
  const newId = parsed.data.channelId;
  setSessions((prev) => {
    if (prev.length === 0) return [{ channelId: newId, state: 'idle' }];
    return prev.map((s, i) => (i === prev.length - 1 ? { ...s, channelId: newId } : s));
  });
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectCwd, setActiveProjectCwd] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionStateSummary[]>([]);
  const { socket } = useSocket();
  const { setInitOptions } = useSession();

  // biome-ignore lint/correctness/useExhaustiveDependencies: setInitOptions is stable (useState initializer in SessionProvider)
  useEffect(() => {
    const onConnect = () => {
      socket.emit('app:init', (raw) => {
        const parsed = initResponseSchema.safeParse(raw);
        if (!parsed.success) return;
        setSessions(parsed.data.sessions);
        setProjects((prev) => deriveProjects(parsed.data.sessions, prev));
        if (parsed.data.settings && Object.keys(parsed.data.settings).length > 0) {
          setInitOptions(parsed.data.settings);
        }
      });
    };

    const onCreated = (raw: unknown) => handleCreated(raw, setSessions);
    const onDead = (raw: unknown) => handleDead(raw, setSessions);
    const onStates = (raw: unknown) => handleStates(raw, setSessions);
    const onResume = (raw: unknown) => handleResume(raw, setSessions);

    socket.on('connect', onConnect);
    if (socket.connected) onConnect();
    socket.on('session:created', onCreated);
    socket.on('session:dead', onDead);
    socket.on('session:states', onStates);
    socket.on('session:resume', onResume);
    return () => {
      socket.off('connect', onConnect);
      socket.off('session:created', onCreated);
      socket.off('session:dead', onDead);
      socket.off('session:states', onStates);
      socket.off('session:resume', onResume);
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
