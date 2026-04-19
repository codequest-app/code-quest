import '@testing-library/jest-dom/vitest';
import { createFakeSocket } from '@code-quest/summoner/test';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { usePreferencesStore } from '../stores/usePreferencesStore';

beforeEach(() => {
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

// react-resizable-panels requires full DOM measurement APIs unavailable in jsdom
vi.mock('react-resizable-panels', async () => {
  const React = await import('react');
  const h = React.createElement;
  return {
    Group: (p: { children?: React.ReactNode }) =>
      h('div', { 'data-testid': 'panel-group' }, p.children),
    Panel: (p: { children?: React.ReactNode; 'data-testid'?: string }) =>
      h('div', { 'data-testid': p['data-testid'] }, p.children),
    Separator: () => h('div', { 'data-testid': 'resize-handle' }),
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
