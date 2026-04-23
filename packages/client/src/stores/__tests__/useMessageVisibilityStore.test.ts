import { describe, expect, it } from 'vitest';
import { memoryBackend, readPersistedRaw } from '../../test/memory-persist-storage';
import { useMessageVisibilityStore } from '../useMessageVisibilityStore';

const STORAGE_KEY = 'code-quest:message-visibility';

describe('useMessageVisibilityStore', () => {
  it('has null as default (defers to context defaults)', () => {
    expect(useMessageVisibilityStore.getState().enabledTypes).toBeNull();
  });

  it('setEnabledTypes updates the store', () => {
    useMessageVisibilityStore.getState().setEnabledTypes(['text', 'tool_use']);
    expect(useMessageVisibilityStore.getState().enabledTypes).toEqual(['text', 'tool_use']);
  });

  it('persists via zustand persist in the standard { state, version } envelope', () => {
    useMessageVisibilityStore.getState().setEnabledTypes(['text', 'hook_started']);
    const stored = JSON.parse(readPersistedRaw(STORAGE_KEY) ?? '{}');
    expect(stored.state.enabledTypes).toContain('hook_started');
    expect(stored.state.enabledTypes).toContain('text');
  });

  it('restores from persisted storage on rehydrate', () => {
    memoryBackend.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { enabledTypes: ['hook_started', 'text'] }, version: 0 }),
    );
    useMessageVisibilityStore.persist.rehydrate();
    expect(useMessageVisibilityStore.getState().enabledTypes).toContain('hook_started');
  });
});
