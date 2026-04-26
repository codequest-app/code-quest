import { describe, expect, it, vi } from 'vitest';
import { createAddProjectFeature } from '../add-project-feature';
import { createOpenSettingsFeature } from '../open-settings-feature';
import { createSwitchProjectFeatures } from '../switch-project-feature';

describe('createSwitchProjectFeatures', () => {
  it('returns one feature per project', () => {
    const features = createSwitchProjectFeatures({
      projects: [
        { cwd: '/a', label: 'A' },
        { cwd: '/b', label: 'B' },
      ],
      onSelect: vi.fn(),
    });
    expect(features).toHaveLength(2);
    expect(features[0].id).toBe('switch-project-/a');
    expect(features[0].label).toBe('A');
    expect(features[1].id).toBe('switch-project-/b');
    expect(features[1].label).toBe('B');
  });

  it('each feature is in Context section with actions tab', () => {
    const features = createSwitchProjectFeatures({
      projects: [{ cwd: '/a', label: 'A' }],
      onSelect: vi.fn(),
    });
    expect(features[0].section).toBe('Context');
    expect(features[0].tabs).toEqual(['all', 'actions']);
  });

  it('active project has toggle state active=true', () => {
    const features = createSwitchProjectFeatures({
      projects: [
        { cwd: '/a', label: 'A' },
        { cwd: '/b', label: 'B' },
      ],
      activeCwd: '/b',
      onSelect: vi.fn(),
    });
    expect(features[0].state).toEqual({ kind: 'toggle', active: false });
    expect(features[1].state).toEqual({ kind: 'toggle', active: true });
  });

  it('execute calls onSelect with the project cwd', () => {
    const onSelect = vi.fn();
    const features = createSwitchProjectFeatures({
      projects: [
        { cwd: '/a', label: 'A' },
        { cwd: '/b', label: 'B' },
      ],
      onSelect,
    });
    features[1].execute();
    expect(onSelect).toHaveBeenCalledWith('/b');
  });

  it('returns empty array when no projects', () => {
    const features = createSwitchProjectFeatures({
      projects: [],
      onSelect: vi.fn(),
    });
    expect(features).toEqual([]);
  });
});

describe('createAddProjectFeature', () => {
  it('returns a feature that calls onAdd on execute', () => {
    const onAdd = vi.fn();
    const feature = createAddProjectFeature({ onAdd });
    expect(feature.id).toBe('add-project');
    expect(feature.label).toBe('Add Project');
    feature.execute();
    expect(onAdd).toHaveBeenCalledOnce();
  });
});

describe('createOpenSettingsFeature', () => {
  it('returns a feature that calls onOpen on execute', () => {
    const onOpen = vi.fn();
    const feature = createOpenSettingsFeature({ onOpen });
    expect(feature.id).toBe('open-settings');
    expect(feature.label).toBe('Open Settings');
    feature.execute();
    expect(onOpen).toHaveBeenCalledOnce();
  });
});
