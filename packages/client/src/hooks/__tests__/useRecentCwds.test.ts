import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useRecentCwds } from '../useRecentCwds';

const STORAGE_KEY = 'cc-office:recent-cwds';

afterEach(() => {
  localStorage.removeItem(STORAGE_KEY);
});

describe('useRecentCwds', () => {
  it('returns empty array initially', () => {
    const { result } = renderHook(() => useRecentCwds());
    expect(result.current.recents).toEqual([]);
  });

  it('addRecent adds a path', () => {
    const { result } = renderHook(() => useRecentCwds());
    act(() => result.current.addRecent('/projects/app'));
    expect(result.current.recents[0].path).toBe('/projects/app');
  });

  it('deduplicates — adding same path updates lastUsed', () => {
    const { result } = renderHook(() => useRecentCwds());
    act(() => result.current.addRecent('/projects/app'));
    act(() => result.current.addRecent('/projects/blog'));
    act(() => result.current.addRecent('/projects/app'));
    expect(result.current.recents.length).toBe(2);
    expect(result.current.recents[0].path).toBe('/projects/app');
  });

  it('caps at 10 entries', () => {
    const { result } = renderHook(() => useRecentCwds());
    for (let i = 0; i < 15; i++) {
      act(() => result.current.addRecent(`/path/${i}`));
    }
    expect(result.current.recents.length).toBe(10);
  });

  it('persists to localStorage', () => {
    const { result } = renderHook(() => useRecentCwds());
    act(() => result.current.addRecent('/projects/app'));

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    expect(stored.length).toBe(1);
    expect(stored[0].path).toBe('/projects/app');
  });

  it('reads from localStorage on mount', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ path: '/existing', lastUsed: Date.now() }]),
    );
    const { result } = renderHook(() => useRecentCwds());
    expect(result.current.recents[0].path).toBe('/existing');
  });
});
