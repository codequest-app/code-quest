import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { useRightPaneScopeStore } from '../../stores/useRightPaneScopeStore';
import {
  RightPaneScopeProvider,
  useRightPaneCwd,
  useRightPaneScope,
  useRightPaneScopeActions,
} from '../RightPaneScopeContext';

function wrapper(activeCwd: string | null) {
  return ({ children }: { children: ReactNode }) => (
    <RightPaneScopeProvider activeCwd={activeCwd}>{children}</RightPaneScopeProvider>
  );
}

describe('RightPaneScopeContext', () => {
  it('defaults to follow mode', () => {
    const { result } = renderHook(() => useRightPaneScope(), { wrapper: wrapper('/repo') });
    expect(result.current).toEqual({ mode: 'follow' });
  });

  it('togglePin switches to pinned with current activeCwd', () => {
    const { result } = renderHook(
      () => ({ scope: useRightPaneScope(), actions: useRightPaneScopeActions() }),
      { wrapper: wrapper('/repo') },
    );
    act(() => result.current.actions.togglePin());
    expect(result.current.scope).toEqual({ mode: 'pinned', cwd: '/repo' });
  });

  it('togglePin back to follow from pinned', () => {
    const { result } = renderHook(
      () => ({ scope: useRightPaneScope(), actions: useRightPaneScopeActions() }),
      { wrapper: wrapper('/repo') },
    );
    act(() => result.current.actions.togglePin());
    act(() => result.current.actions.togglePin());
    expect(result.current.scope).toEqual({ mode: 'follow' });
  });

  it('useRightPaneCwd returns activeCwd in follow mode', () => {
    const { result } = renderHook(() => useRightPaneCwd(), { wrapper: wrapper('/repo') });
    expect(result.current).toBe('/repo');
  });

  it('useRightPaneCwd returns pinned cwd even after rerender', () => {
    const { result, rerender } = renderHook(
      () => ({ cwd: useRightPaneCwd(), actions: useRightPaneScopeActions() }),
      { wrapper: wrapper('/repo-a') },
    );
    act(() => result.current.actions.togglePin());
    expect(result.current.cwd).toBe('/repo-a');
    rerender();
    expect(result.current.cwd).toBe('/repo-a');
  });

  it('togglePin is no-op when activeCwd is null', () => {
    const { result } = renderHook(
      () => ({ scope: useRightPaneScope(), actions: useRightPaneScopeActions() }),
      { wrapper: wrapper(null) },
    );
    act(() => result.current.actions.togglePin());
    expect(result.current.scope).toEqual({ mode: 'follow' });
  });

  it('resetIfCwdMissing resets to follow when pinned cwd is not in known set', () => {
    const { result } = renderHook(
      () => ({ scope: useRightPaneScope(), actions: useRightPaneScopeActions() }),
      { wrapper: wrapper('/repo') },
    );
    act(() => result.current.actions.togglePin());
    expect(result.current.scope).toEqual({ mode: 'pinned', cwd: '/repo' });
    act(() => result.current.actions.resetIfCwdMissing(new Set(['/other'])));
    expect(result.current.scope).toEqual({ mode: 'follow' });
  });

  it('resetIfCwdMissing is no-op when pinned cwd is in known set', () => {
    const { result } = renderHook(
      () => ({ scope: useRightPaneScope(), actions: useRightPaneScopeActions() }),
      { wrapper: wrapper('/repo') },
    );
    act(() => result.current.actions.togglePin());
    act(() => result.current.actions.resetIfCwdMissing(new Set(['/repo'])));
    expect(result.current.scope).toEqual({ mode: 'pinned', cwd: '/repo' });
  });

  it('resetIfCwdMissing is no-op in follow mode', () => {
    const { result } = renderHook(
      () => ({ scope: useRightPaneScope(), actions: useRightPaneScopeActions() }),
      { wrapper: wrapper('/repo') },
    );
    act(() => result.current.actions.resetIfCwdMissing(new Set()));
    expect(result.current.scope).toEqual({ mode: 'follow' });
  });

  it('pinTo pins to an arbitrary cwd', () => {
    const { result } = renderHook(
      () => ({
        scope: useRightPaneScope(),
        actions: useRightPaneScopeActions(),
        cwd: useRightPaneCwd(),
      }),
      { wrapper: wrapper('/repo-a') },
    );
    act(() => result.current.actions.pinTo('/repo-b'));
    expect(result.current.scope).toEqual({ mode: 'pinned', cwd: '/repo-b' });
    expect(result.current.cwd).toBe('/repo-b');
  });

  it('unpin returns to follow mode', () => {
    const { result } = renderHook(
      () => ({ scope: useRightPaneScope(), actions: useRightPaneScopeActions() }),
      { wrapper: wrapper('/repo') },
    );
    act(() => result.current.actions.pinTo('/other'));
    act(() => result.current.actions.unpin());
    expect(result.current.scope).toEqual({ mode: 'follow' });
  });

  it('store state is shared across hooks (no Provider-scoped isolation)', () => {
    act(() => useRightPaneScopeStore.getState().pinTo('/from-store'));
    const { result } = renderHook(() => useRightPaneScope(), { wrapper: wrapper('/repo') });
    expect(result.current).toEqual({ mode: 'pinned', cwd: '/from-store' });
  });
});
