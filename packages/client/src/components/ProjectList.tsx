import type { Project } from '../contexts/ProjectContext';
import { ProjectCard } from './ProjectCard';
import { SectionHeader } from './ui/SectionHeader';

function byLastOpenedDesc(a: Project, b: Project): number {
  return a.lastOpenedAt < b.lastOpenedAt ? 1 : -1;
}

export function ProjectList({
  projects,
  activeProjectCwd,
  onSelect,
  onAdd,
}: {
  projects: Project[];
  activeProjectCwd: string | null;
  onSelect: (cwd: string) => void;
  onAdd: () => void;
}) {
  const pinned = projects.filter((p) => p.pinned).sort(byLastOpenedDesc);
  const recent = projects.filter((p) => !p.pinned).sort(byLastOpenedDesc);
  // Show Pinned header whenever pinned items exist (emphasizes the curated set).
  // Show Recent header only when both groups exist (otherwise it's just a flat list).
  const showPinnedHeader = pinned.length > 0;
  const showRecentHeader = pinned.length > 0 && recent.length > 0;

  return (
    <div className="flex flex-col h-full">
      <SectionHeader>Projects</SectionHeader>
      <div className="flex-1 overflow-auto px-2">
        {pinned.length > 0 && (
          <>
            {showPinnedHeader && (
              <div className="px-1 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Pinned
              </div>
            )}
            {pinned.map((p) => (
              <ProjectCard
                key={p.cwd}
                name={p.name}
                cwd={p.cwd}
                pinned={p.pinned}
                active={p.cwd === activeProjectCwd}
                onSelect={() => onSelect(p.cwd)}
              />
            ))}
          </>
        )}
        {recent.length > 0 && (
          <>
            {showRecentHeader && (
              <div className="px-1 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Recent
              </div>
            )}
            {recent.map((p) => (
              <ProjectCard
                key={p.cwd}
                name={p.name}
                cwd={p.cwd}
                pinned={p.pinned}
                active={p.cwd === activeProjectCwd}
                onSelect={() => onSelect(p.cwd)}
              />
            ))}
          </>
        )}
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
