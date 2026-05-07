import type { Feature } from '@/lib/feature';

interface AddProjectDeps {
  onAdd: () => void;
}

export function createAddProjectFeature({ onAdd }: AddProjectDeps): Feature {
  return {
    id: 'add-project',
    label: 'Add Project',
    section: 'Context',
    tabs: ['all', 'actions'],
    order: 2,
    execute: onAdd,
  };
}
