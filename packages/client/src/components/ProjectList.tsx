import { PlusIcon } from '@heroicons/react/24/outline';
import type { Project } from '../contexts/ProjectContext';
import { ProjectCard } from './ProjectCard';

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
  return (
    <div className="flex flex-col h-full">
      <div className="px-2 py-1 text-xs font-semibold uppercase text-muted">Projects</div>
      <div className="flex-1 overflow-auto">
        {projects.map((p) => (
          <ProjectCard
            key={p.cwd}
            name={p.name}
            cwd={p.cwd}
            active={p.cwd === activeProjectCwd}
            onSelect={() => onSelect(p.cwd)}
          />
        ))}
      </div>
      <button
        type="button"
        className="mx-2 my-2 px-3 py-2 text-sm rounded border border-dashed border-border hover:bg-white/5 text-text-muted"
        onClick={onAdd}
      >
        <PlusIcon className="w-4 h-4 inline-block mr-1 align-text-bottom" />
        Add
      </button>
    </div>
  );
}
