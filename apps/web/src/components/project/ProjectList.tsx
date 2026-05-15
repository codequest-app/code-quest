import type { Project } from '@/contexts/ProjectContext';
import { GhostAddButton } from '../ui/GhostAddButton.tsx';
import { GroupHeader } from '../ui/GroupHeader.tsx';
import { SectionHeader } from '../ui/SectionHeader.tsx';
import { ProjectCard } from './ProjectCard.tsx';
import { splitPinnedRecent } from './project-utils.ts';

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
}): React.JSX.Element {
  const { pinned, recent } = splitPinnedRecent(projects);
  // Show Recent header only when both groups exist (otherwise it's just a flat list).
  const showRecentHeader = pinned.length > 0 && recent.length > 0;

  return (
    <div className="flex flex-col h-full">
      <SectionHeader>Projects</SectionHeader>
      <div className="flex-1 overflow-auto px-2">
        {pinned.length > 0 && (
          <>
            <GroupHeader>Pinned</GroupHeader>
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
            {showRecentHeader && <GroupHeader>Recent</GroupHeader>}
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
      <GhostAddButton onClick={onAdd} className="mx-2 my-2 px-3 py-1.5 text-center">
        + Add Project
      </GhostAddButton>
    </div>
  );
}
