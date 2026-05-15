import '@testing-library/jest-dom/vitest';
import { createFakeSocket } from '@code-quest/test-kit';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

// Tests run on the socket.io transport path so the existing
// vi.mock('socket.io-client') below stays the single source of fake sockets.
// Production ships with VITE_TRANSPORT=ws (the project default) elsewhere.
vi.stubEnv('VITE_TRANSPORT', 'socketio');

import { usePreferencesStore } from '../stores/usePreferencesStore.ts';
import { memoryBackend, memoryPersist } from './memory-persist-storage.ts';

// DI: swap each persisted store's storage adapter from localStorage to the
// in-memory backend. Production stores know nothing about tests.
usePreferencesStore.persist.setOptions({ storage: memoryPersist() });

beforeEach(() => {
  memoryBackend.clear();
  usePreferencesStore.setState({
    expandedProjects: [],
    enabledTypes: null,
    hiddenItems: ['onboarding-overlay'],
  });
});

afterEach(() => {
  cleanup();
  // Radix Dialog sets pointer-events:none on body while open. Clear it after
  // cleanup so it doesn't bleed into the next file when shuffle is on.
  document.body.style.pointerEvents = '';
  // Restore all vi.spyOn mocks so prototype spies (e.g. scrollHeight in
  // Expandable tests) don't bleed into subsequent files when shuffle is on.
  vi.restoreAllMocks();
});

vi.mock('@iconify/react', async () => {
  const React = await import('react');
  return {
    Icon: ({ icon }: { icon: string }) => React.createElement('svg', { 'data-icon': icon }),
    addCollection: () => {},
  };
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

// happy-dom has no ResizeObserver. This stub fires the callback once on observe()
// so components that read scrollHeight/clientHeight inside it get a chance to update.
global.ResizeObserver = class ResizeObserver {
  private cb: ResizeObserverCallback;
  constructor(cb: ResizeObserverCallback) {
    this.cb = cb;
  }
  observe(_target: Element) {
    this.cb([], this);
  }
  unobserve() {}
  disconnect() {}
};

// react-resizable-panels requires full DOM measurement APIs unavailable in happy-dom.
// Mock matches real API (PanelGroup / Panel / PanelResizeHandle); Panel forwards
// ref to a minimal object so imperative collapse/expand calls in prod code
// become observable spies rather than real drags.
vi.mock('react-resizable-panels', async () => {
  const React = await import('react');
  const h = React.createElement;
  return {
    PanelGroup: (p: { children?: React.ReactNode; autoSaveId?: string; direction?: string }) =>
      h('div', { 'aria-label': 'panel-group', 'data-autosave-id': p.autoSaveId }, p.children),
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
            'aria-label': (p as { 'aria-label'?: string })['aria-label'] ?? `panel-${p.id ?? ''}`,
          },
          p.children,
        );
      },
    ),
    PanelResizeHandle: () => h('div', { 'aria-label': 'resize-handle' }),
  };
});

// happy-dom has no layout → TanStack Virtual's getBoundingClientRect returns zeros
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
