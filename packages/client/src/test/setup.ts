import '@testing-library/jest-dom/vitest';
import { createFakeSocket } from '@code-quest/summoner/test';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { useExpandedProjectsStore } from '../stores/useExpandedProjectsStore';
import { useMessageVisibilityStore } from '../stores/useMessageVisibilityStore';
import { usePreferencesStore } from '../stores/usePreferencesStore';
import { memoryBackend, memoryPersist } from './memory-persist-storage';

// DI: swap each persisted store's storage adapter from localStorage to the
// in-memory backend. Production stores know nothing about tests.
for (const store of [useExpandedProjectsStore, useMessageVisibilityStore, usePreferencesStore]) {
  store.persist.setOptions({ storage: memoryPersist() });
}

beforeEach(() => {
  memoryBackend.clear();
  useExpandedProjectsStore.setState({ expanded: [] });
  useMessageVisibilityStore.setState({ enabledTypes: null });
  usePreferencesStore.setState({ hiddenItems: ['onboarding-overlay'] });
});

afterEach(() => {
  cleanup();
});

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => {
    const socket = createFakeSocket();
    vi.spyOn(socket, 'connect');
    vi.spyOn(socket, 'disconnect');
    vi.spyOn(socket, 'emit');
    vi.spyOn(socket, 'on');
    vi.spyOn(socket, 'off');
    return socket;
  }),
}));

// jsdom's requestAnimationFrame may not flush reliably — provide a sync-like polyfill
{
  let rafId = 0;
  const pending = new Map<number, FrameRequestCallback>();
  window.requestAnimationFrame = (cb: FrameRequestCallback) => {
    const id = ++rafId;
    pending.set(id, cb);
    Promise.resolve().then(() => {
      const fn = pending.get(id);
      if (fn) {
        pending.delete(id);
        fn(performance.now());
      }
    });
    return id;
  };
  window.cancelAnimationFrame = (id: number) => {
    pending.delete(id);
  };
}

// jsdom doesn't implement scrollIntoView
if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = () => {};
}

// jsdom doesn't implement ResizeObserver
if (typeof ResizeObserver === 'undefined') {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

// react-resizable-panels requires full DOM measurement APIs unavailable in jsdom.
// Mock matches real API (PanelGroup / Panel / PanelResizeHandle); Panel forwards
// ref to a minimal object so imperative collapse/expand calls in prod code
// become observable spies rather than real drags.
vi.mock('react-resizable-panels', async () => {
  const React = await import('react');
  const h = React.createElement;
  return {
    PanelGroup: (p: { children?: React.ReactNode; autoSaveId?: string; direction?: string }) =>
      h('div', { 'data-testid': 'panel-group', 'data-autosave-id': p.autoSaveId }, p.children),
    Panel: React.forwardRef(
      (
        p: { children?: React.ReactNode; id?: string; [k: string]: unknown },
        ref: React.Ref<{ collapse: () => void; expand: () => void; isCollapsed: () => boolean }>,
      ) => {
        // Expose a minimal imperative handle so tests / production refs don't crash.
        React.useImperativeHandle(
          ref,
          () => ({
            collapse: () => {},
            expand: () => {},
            isCollapsed: () => false,
          }),
          [],
        );
        return h(
          'div',
          {
            'data-testid':
              (p as { 'data-testid'?: string })['data-testid'] ?? `panel-${p.id ?? ''}`,
          },
          p.children,
        );
      },
    ),
    PanelResizeHandle: () => h('div', { 'data-testid': 'resize-handle' }),
  };
});

// jsdom doesn't implement matchMedia — default to desktop (≥1024px)
if (typeof window.matchMedia === 'undefined') {
  window.matchMedia = (query: string) =>
    ({
      matches: query === '(min-width: 1024px)' || query === '(min-width: 768px)',
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

// jsdom doesn't implement IntersectionObserver
if (typeof IntersectionObserver === 'undefined') {
  global.IntersectionObserver = class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
}

// jsdom has no layout → TanStack Virtual's getBoundingClientRect returns zeros
// so the virtualizer renders nothing. Mock useVirtualizer to render all items
// (matches pre-virtualization DOM, keeps querySelector-based assertions working).
vi.mock('@tanstack/react-virtual', async () => {
  const actual =
    await vi.importActual<typeof import('@tanstack/react-virtual')>('@tanstack/react-virtual');
  type Opts = { count: number };
  type VirtualItem = { index: number; start: number; size: number; key: number };
  return {
    ...actual,
    useVirtualizer: ({ count }: Opts) => ({
      getTotalSize: () => count * 80,
      getVirtualItems: (): VirtualItem[] =>
        Array.from({ length: count }, (_, i) => ({
          index: i,
          start: i * 80,
          size: 80,
          key: i,
        })),
      measureElement: () => {},
      scrollToIndex: () => {},
    }),
  };
});
