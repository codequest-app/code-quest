import type { Feature } from '../../lib/feature';

interface SwitchProjectDeps {
  projects: Array<{ cwd: string; label: string }>;
  activeCwd?: string | null;
  onSelect: (cwd: string) => void;
}

export function createSwitchProjectFeatures({
  projects,
  activeCwd,
  onSelect,
}: SwitchProjectDeps): Feature[] {
  return projects.map((p) => ({
    id: `switch-project-${p.cwd}`,
    label: p.label,
    section: 'Context' as const,
    tabs: ['all', 'actions'] as const,
    order: 1,
    state: { kind: 'toggle' as const, active: p.cwd === activeCwd },
    execute() {
      onSelect(p.cwd);
    },
  }));
}
