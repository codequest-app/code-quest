import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useBreakpoint } from '../useBreakpoint.ts';

type MediaQueryListener = (e: MediaQueryListEvent) => void;

function mockMatchMedia(initialWidth: number) {
  let currentWidth = initialWidth;
  const listeners = new Map<string, Set<MediaQueryListener>>();

  const queryMatches = (query: string, w: number) => {
    if (query === '(min-width: 1024px)') return w >= 1024;
    if (query === '(min-width: 768px)') return w >= 768;
    return false;
  };

  window.matchMedia = vi.fn(
    (query: string) =>
      ({
        get matches() {
          return queryMatches(query, currentWidth);
        },
        media: query,
        addEventListener: (_: string, fn: MediaQueryListener) => {
          if (!listeners.has(query)) listeners.set(query, new Set());
          listeners.get(query)!.add(fn);
        },
        removeEventListener: (_: string, fn: MediaQueryListener) => {
          listeners.get(query)?.delete(fn);
        },
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  );

  return {
    triggerChange: (newWidth: number) => {
      currentWidth = newWidth;
      for (const [query, fns] of listeners) {
        const matches = queryMatches(query, newWidth);
        for (const fn of fns) fn({ matches } as MediaQueryListEvent);
      }
    },
  };
}

describe('useBreakpoint', () => {
  afterEach(() => vi.restoreAllMocks());

  describe('initial value', () => {
    it('returns "desktop" when width >= 1024px', () => {
      mockMatchMedia(1440);
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe('desktop');
    });

    it('returns "desktop" at exactly 1024px', () => {
      mockMatchMedia(1024);
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe('desktop');
    });

    it('returns "tablet" when 768px <= width < 1024px', () => {
      mockMatchMedia(768);
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe('tablet');
    });

    it('returns "tablet" at exactly 768px', () => {
      mockMatchMedia(768);
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe('tablet');
    });

    it('returns "mobile" when width < 768px', () => {
      mockMatchMedia(767);
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe('mobile');
    });
  });

  describe('reacts to matchMedia changes', () => {
    it('updates from desktop to tablet when width drops below 1024px', () => {
      const { triggerChange } = mockMatchMedia(1440);
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe('desktop');

      act(() => triggerChange(800));
      expect(result.current).toBe('tablet');
    });

    it('updates from tablet to mobile when width drops below 768px', () => {
      const { triggerChange } = mockMatchMedia(800);
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe('tablet');

      act(() => triggerChange(375));
      expect(result.current).toBe('mobile');
    });

    it('updates from mobile to desktop when width grows to 1024px+', () => {
      const { triggerChange } = mockMatchMedia(375);
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe('mobile');

      act(() => triggerChange(1280));
      expect(result.current).toBe('desktop');
    });
  });
});
