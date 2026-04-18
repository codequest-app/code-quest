import { describe, expect, it, vi } from 'vitest';
import type { GroupId, GroupState } from '../../../contexts/channel';
import { VISIBILITY_GROUPS } from '../../../contexts/channel';
import { createFilterFeatures } from '../create-filter-features';

function makeStates(
  overrides: Partial<Record<GroupId, GroupState>> = {},
): Record<GroupId, GroupState> {
  const base: Record<GroupId, GroupState> = {
    conversation: 'all',
    tools: 'all',
    system: 'all',
    hooks: 'none',
    debug: 'none',
    other: 'none',
  };
  return { ...base, ...overrides };
}

describe('createFilterFeatures', () => {
  it('returns one Feature per visibility group', () => {
    const features = createFilterFeatures({
      states: makeStates(),
      toggleGroup: vi.fn(),
      onPartialClick: vi.fn(),
    });
    const expectedIds = VISIBILITY_GROUPS.map((g) => `filter-${g.id}`);
    expect(features.map((f) => f.id)).toEqual(expectedIds);
  });

  it('each feature is in Filters category with label matching group label', () => {
    const features = createFilterFeatures({
      states: makeStates(),
      toggleGroup: vi.fn(),
      onPartialClick: vi.fn(),
    });
    for (const [i, feature] of features.entries()) {
      expect(feature.category).toBe('Filters');
      expect(feature.label).toBe(VISIBILITY_GROUPS[i].label);
    }
  });

  it('state is tri-state reflecting current group state', () => {
    const features = createFilterFeatures({
      states: makeStates({ hooks: 'partial' }),
      toggleGroup: vi.fn(),
      onPartialClick: vi.fn(),
    });
    const hooks = features.find((f) => f.id === 'filter-hooks');
    expect(hooks?.state).toMatchObject({ kind: 'tri-state', state: 'partial' });
  });

  it('execute calls toggleGroup for that group', () => {
    const toggleGroup = vi.fn();
    const features = createFilterFeatures({
      states: makeStates(),
      toggleGroup,
      onPartialClick: vi.fn(),
    });
    features.find((f) => f.id === 'filter-tools')?.execute();
    expect(toggleGroup).toHaveBeenCalledWith('tools');
  });

  it('onPartial calls onPartialClick for that group when partial', () => {
    const onPartialClick = vi.fn();
    const features = createFilterFeatures({
      states: makeStates({ hooks: 'partial' }),
      toggleGroup: vi.fn(),
      onPartialClick,
    });
    const hooks = features.find((f) => f.id === 'filter-hooks');
    if (hooks?.state?.kind !== 'tri-state') throw new Error('expected tri-state');
    hooks.state.onPartial?.();
    expect(onPartialClick).toHaveBeenCalledWith('hooks');
  });
});
