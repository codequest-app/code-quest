import type { GroupId, GroupState } from '../../contexts/channel';
import { VISIBILITY_GROUPS } from '../../contexts/channel';
import type { Feature } from '../../lib/feature';

export interface CreateFilterFeaturesDeps {
  states: Record<GroupId, GroupState>;
  toggleGroup: (id: GroupId) => void;
  onPartialClick: (id: GroupId) => void;
}

export function createFilterFeatures({
  states,
  toggleGroup,
  onPartialClick,
}: CreateFilterFeaturesDeps): Feature[] {
  return VISIBILITY_GROUPS.map((group, order) => ({
    id: `filter-${group.id}`,
    label: group.label,
    category: 'Filters',
    order,
    state: {
      kind: 'tri-state' as const,
      state: states[group.id],
      onPartial: () => onPartialClick(group.id),
    },
    execute: () => toggleGroup(group.id),
  }));
}
