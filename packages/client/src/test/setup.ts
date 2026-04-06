import '@testing-library/jest-dom/vitest';
import { createFakeSocket } from '@code-quest/summoner/test';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

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

// jsdom doesn't implement IntersectionObserver
if (typeof IntersectionObserver === 'undefined') {
  global.IntersectionObserver = class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
}
