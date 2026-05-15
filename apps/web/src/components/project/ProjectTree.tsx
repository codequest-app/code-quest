import type { Project } from '@/contexts/ProjectContext';
import { GhostAddButton } from '../ui/GhostAddButton.tsx';
import { GroupHeader } from '../ui/GroupHeader.tsx';
import { SectionHeader } from '../ui/SectionHeader.tsx';
import { ProjectRow } from './ProjectRow.tsx';
import { splitPinnedRecent } from './project-utils.ts';

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
  const { pinned, recent } = splitPinnedRecent(projects);
  const showRecentHeader = pinned.length > 0 && recent.length > 0;

  return (
    <div className="flex flex-col h-full">
      <SectionHeader>Projects</SectionHeader>
      <div className="flex-1 overflow-auto px-2">
        {pinned.length > 0 && <GroupHeader>Pinned</GroupHeader>}
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
