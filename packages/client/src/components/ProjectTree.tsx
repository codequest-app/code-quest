import type { Project } from '../contexts/ProjectContext';
import { ProjectRow } from './ProjectRow';
import { SectionHeader } from './ui/SectionHeader';

function byLastOpenedDesc(a: Project, b: Project): number {
  return a.lastOpenedAt < b.lastOpenedAt ? 1 : -1;
}

export function ProjectTree({
  projects,
  activeProjectCwd,
  onSelectProject,
  onAdd,
}: {
  projects: Project[];
  activeProjectCwd: string | null;
  onSelectProject: (cwd: string) => void;
  onAdd: () => void;
}) {
  const pinned = projects.filter((p) => p.pinned).sort(byLastOpenedDesc);
  const recent = projects.filter((p) => !p.pinned).sort(byLastOpenedDesc);
  const showPinnedHeader = pinned.length > 0;
  const showRecentHeader = pinned.length > 0 && recent.length > 0;

  return (
    <div className="flex flex-col h-full">
      <SectionHeader>Projects</SectionHeader>
      <div className="flex-1 overflow-auto px-2">
        {showPinnedHeader && <GroupHeader>Pinned</GroupHeader>}
        {pinned.map((p) => (
          <ProjectRow
            key={p.cwd}
            project={p}
            active={p.cwd === activeProjectCwd}
            onSelect={() => onSelectProject(p.cwd)}
          />
        ))}
        {showRecentHeader && <GroupHeader>Recent</GroupHeader>}
        {recent.map((p) => (
          <ProjectRow
            key={p.cwd}
            project={p}
            active={p.cwd === activeProjectCwd}
            onSelect={() => onSelectProject(p.cwd)}
          />
        ))}
      </div>
      <button
        type="button"
        className="mx-2 my-2 px-3 py-1.5 text-xs text-center rounded border border-dashed border-border bg-transparent text-text-muted hover:text-text hover:border-accent"
        onClick={onAdd}
      >
        + Add Project
      </button>
    </div>
  );
}

function GroupHeader({ children }: { children: React.ReactNode }) {
  return <div className="section-label px-1 pt-2 pb-1">{children}</div>;
}
