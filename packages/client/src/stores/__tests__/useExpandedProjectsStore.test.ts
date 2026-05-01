import { describe, expect, it } from 'vitest';
import { readPersistedRaw } from '@/test/memory-persist-storage';
import { useExpandedProjectsStore } from '../useExpandedProjectsStore';

describe('useExpandedProjectsStore', () => {
  it('starts empty — no project is expanded', () => {
    expect(useExpandedProjectsStore.getState().isExpanded('/any')).toBe(false);
  });

  it('toggle adds then removes', () => {
    const { toggle, isExpanded } = useExpandedProjectsStore.getState();
    toggle('/a');
    expect(isExpanded('/a')).toBe(true);
    toggle('/a');
    expect(isExpanded('/a')).toBe(false);
  });

  it('setExpanded is idempotent', () => {
    const { setExpanded, isExpanded } = useExpandedProjectsStore.getState();
    setExpanded('/a', true);
    setExpanded('/a', true);
    expect(useExpandedProjectsStore.getState().expanded).toEqual(['/a']);
    setExpanded('/a', false);
    setExpanded('/a', false);
    expect(isExpanded('/a')).toBe(false);
  });

  it('persists via zustand persist (read back through the injected storage)', () => {
    useExpandedProjectsStore.getState().toggle('/a');
    const raw = readPersistedRaw('cc-office.expandedProjects');
    expect(raw).toBeTruthy();
    // zustand persist wraps state under { state, version }
    expect(JSON.parse(raw!).state.expanded).toContain('/a');
  });

  it('multiple toggles from independent callers converge (single source of truth)', () => {
    const store = useExpandedProjectsStore.getState();
    store.toggle('/a');
    store.toggle('/b');
    expect(useExpandedProjectsStore.getState().expanded).toEqual(['/a', '/b']);
  });
});
