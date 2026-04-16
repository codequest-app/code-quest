import { beforeEach, describe, expect, it } from 'vitest';
import { useMessageVisibilityStore } from '../useMessageVisibilityStore';

const STORAGE_KEY = 'code-quest:message-visibility';

describe('useMessageVisibilityStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useMessageVisibilityStore.setState({ enabledTypes: null });
  });

  it('has null as default (defers to context defaults)', () => {
    expect(useMessageVisibilityStore.getState().enabledTypes).toBeNull();
  });

  it('setEnabledTypes updates the store', () => {
    useMessageVisibilityStore.getState().setEnabledTypes(['text', 'tool_use']);
    expect(useMessageVisibilityStore.getState().enabledTypes).toEqual(['text', 'tool_use']);
  });

  it('persists to localStorage in Zustand format', () => {
    useMessageVisibilityStore.getState().setEnabledTypes(['text', 'hook_started']);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(stored.state.enabledTypes).toContain('hook_started');
    expect(stored.state.enabledTypes).toContain('text');
  });

  it('restores from localStorage on rehydrate', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { enabledTypes: ['hook_started', 'text'] }, version: 0 }),
    );
    useMessageVisibilityStore.persist.rehydrate();
    expect(useMessageVisibilityStore.getState().enabledTypes).toContain('hook_started');
  });
});
