import { describe, expect, it } from 'vitest';
import { readPersistedRaw } from '../../test/memory-persist-storage';
import { useRightPaneScopeStore } from '../useRightPaneScopeStore';

describe('useRightPaneScopeStore', () => {
  it('defaults to follow mode', () => {
    expect(useRightPaneScopeStore.getState().scope).toEqual({ mode: 'follow' });
  });

  it('pinTo sets pinned mode with given cwd', () => {
    useRightPaneScopeStore.getState().pinTo('/repo-b');
    expect(useRightPaneScopeStore.getState().scope).toEqual({ mode: 'pinned', cwd: '/repo-b' });
  });

  it('unpin returns to follow mode', () => {
    useRightPaneScopeStore.getState().pinTo('/repo');
    useRightPaneScopeStore.getState().unpin();
    expect(useRightPaneScopeStore.getState().scope).toEqual({ mode: 'follow' });
  });

  it('resetIfCwdMissing resets when pinned cwd not in known set', () => {
    useRightPaneScopeStore.getState().pinTo('/repo');
    useRightPaneScopeStore.getState().resetIfCwdMissing(new Set(['/other']));
    expect(useRightPaneScopeStore.getState().scope).toEqual({ mode: 'follow' });
  });

  it('resetIfCwdMissing is no-op when pinned cwd is in known set', () => {
    useRightPaneScopeStore.getState().pinTo('/repo');
    useRightPaneScopeStore.getState().resetIfCwdMissing(new Set(['/repo']));
    expect(useRightPaneScopeStore.getState().scope).toEqual({ mode: 'pinned', cwd: '/repo' });
  });

  it('resetIfCwdMissing is no-op in follow mode', () => {
    useRightPaneScopeStore.getState().resetIfCwdMissing(new Set());
    expect(useRightPaneScopeStore.getState().scope).toEqual({ mode: 'follow' });
  });

  it('persists via zustand persist', () => {
    useRightPaneScopeStore.getState().pinTo('/repo');
    const raw = readPersistedRaw('cc-office.rightPaneScope');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!).state.scope).toEqual({ mode: 'pinned', cwd: '/repo' });
  });

  it('clears persisted state when returning to follow', () => {
    useRightPaneScopeStore.getState().pinTo('/repo');
    useRightPaneScopeStore.getState().unpin();
    const raw = readPersistedRaw('cc-office.rightPaneScope');
    expect(JSON.parse(raw!).state.scope).toEqual({ mode: 'follow' });
  });
});
