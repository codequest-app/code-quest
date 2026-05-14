import type { Project } from '@/contexts/ProjectContext';
import { GhostAddButton } from '../ui/GhostAddButton.tsx';
import { GroupHeader } from '../ui/GroupHeader.tsx';
import { SectionHeader } from '../ui/SectionHeader.tsx';
import { ProjectRow } from './ProjectRow.tsx';

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
}): React.JSX.Element {
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
      <GhostAddButton onClick={onAdd} className="mx-2 my-2 px-3 py-1.5 text-center">
        + Add Project
      </GhostAddButton>
    </div>
  );
}
