import type { Project } from '@/contexts/ProjectContext';

function byLastOpenedDesc(a: Project, b: Project): number {
  return a.lastOpenedAt < b.lastOpenedAt ? 1 : -1;
}

export function splitPinnedRecent(projects: Project[]): { pinned: Project[]; recent: Project[] } {
  const pinned = projects.filter((p) => p.pinned).sort(byLastOpenedDesc);
  const recent = projects.filter((p) => !p.pinned).sort(byLastOpenedDesc);
  return { pinned, recent };
}
