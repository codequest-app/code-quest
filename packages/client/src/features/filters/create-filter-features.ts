import { type GroupId, VISIBILITY_GROUPS } from '@/contexts/channel/MessageVisibilityContext';
import type { Feature } from '@/lib/feature';

export interface CreateFilterFeaturesDeps {
  enabledTypes: Set<string>;
  unknownTypes: Set<string>;
  toggleType: (type: string) => void;
  /** Latest preview sample per message type. Caller memoizes against
   *  `messages` so streaming updates don't rebuild this map per render. */
  latestByType: ReadonlyMap<string, string>;
  onPartial?: (id: GroupId) => void;
}

/**
 * Build a Feature per visibility group. Each Feature's state.items holds
 * the per-type toggle data (label, preview, on, toggle) so FeatureRow can
 * render the composite expandable row without reaching into context.
 */
export function createFilterFeatures({
  enabledTypes,
  unknownTypes,
  toggleType,
  latestByType,
  onPartial,
}: CreateFilterFeaturesDeps): Feature[] {
  return VISIBILITY_GROUPS.map((group, order) => {
    const types = group.id === 'other' ? [...unknownTypes] : group.types;
    const items = types.map((type) => ({
      value: type,
      label: type,
      preview: latestByType.get(type) ?? '',
      on: enabledTypes.has(type),
      toggle: () => toggleType(type),
    }));
    return {
      id: group.id,
      label: group.label,
      section: 'Filters',
      order,
      tabs: ['all', 'actions'],
      state: {
        kind: 'group' as const,
        items,
        ...(onPartial ? { onPartial: () => onPartial(group.id) } : {}),
      },
      // Group rows don't have a meaningful row-click action — interaction
      // is via the label (expand) and the aggregate pill (toggle/onPartial).
      execute: () => {},
    } satisfies Feature;
  });
}
