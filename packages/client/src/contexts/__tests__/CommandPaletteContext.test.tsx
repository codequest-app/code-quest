import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CommandPaletteProvider, useCommandPalette } from '../CommandPaletteContext';

function wrapper({ children }: { children: ReactNode }) {
  return <CommandPaletteProvider>{children}</CommandPaletteProvider>;
}

describe('CommandPaletteContext', () => {
  it('defaults to closed', () => {
    const { result } = renderHook(() => useCommandPalette(), { wrapper });
    expect(result.current.open).toBe(false);
    expect(result.current.defaultTab).toBeUndefined();
  });

  it('openPalette() opens', () => {
    const { result } = renderHook(() => useCommandPalette(), { wrapper });
    act(() => result.current.openPalette());
    expect(result.current.open).toBe(true);
  });

  it('openPalette({ tab }) opens with default tab', () => {
    const { result } = renderHook(() => useCommandPalette(), { wrapper });
    act(() => result.current.openPalette({ tab: 'messages' }));
    expect(result.current.open).toBe(true);
    expect(result.current.defaultTab).toBe('messages');
  });

  it('closePalette() closes', () => {
    const { result } = renderHook(() => useCommandPalette(), { wrapper });
    act(() => result.current.openPalette());
    act(() => result.current.closePalette());
    expect(result.current.open).toBe(false);
  });

  it('registerJumpTo / unregisterJumpTo manage callbacks', () => {
    const { result } = renderHook(() => useCommandPalette(), { wrapper });
    const jumpTo = vi.fn();

    act(() => result.current.registerJumpTo('ch-1', jumpTo));
    result.current.jumpTo('ch-1', 'msg-1');
    expect(jumpTo).toHaveBeenCalledWith('msg-1');

    act(() => result.current.unregisterJumpTo('ch-1'));
    jumpTo.mockClear();
    result.current.jumpTo('ch-1', 'msg-1');
    expect(jumpTo).not.toHaveBeenCalled();
  });

  it('registerActions exposes palette actions', () => {
    const { result } = renderHook(() => useCommandPalette(), { wrapper });
    const onAddProject = vi.fn();
    const onOpenSettings = vi.fn();

    act(() => result.current.registerActions({ onAddProject, onOpenSettings }));

    expect(result.current.paletteActions.onAddProject).toBe(onAddProject);
    expect(result.current.paletteActions.onOpenSettings).toBe(onOpenSettings);
  });

  it('throws when used outside provider', () => {
    expect(() => {
      renderHook(() => useCommandPalette());
    }).toThrow();
  });
});
