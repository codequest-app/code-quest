/**
 * Browser-compatible fake socket for Storybook stories.
 * Replaces @code-quest/summoner/test's createFakeSocket which depends on node:events.
 *
 * Dual-emitter design (mirrors summoner's FakeSocket):
 *   socket.emit(event)  → dispatches to server-side listeners (registered via onServer)
 *   socket.on(event)    → registers client-side listener (receives server pushes)
 */

import type { TypedSocket } from '../socket/client';

type Listener = (...args: unknown[]) => void;

export interface FakeSocketBrowser extends TypedSocket {
  /** Register a server-side handler that receives client `emit()` calls. */
  onServer(event: string, fn: Listener): void;
}

let _seq = 0;

export function createFakeSocketBrowser(): FakeSocketBrowser {
  const id = `fake-${++_seq}`;
  const clientListeners = new Map<string, Set<Listener>>();
  const serverListeners = new Map<string, Set<Listener>>();
  let connected = true;

  function getSet(map: Map<string, Set<Listener>>, event: string): Set<Listener> {
    let s = map.get(event);
    if (!s) {
      s = new Set();
      map.set(event, s);
    }
    return s;
  }

  const socket = {
    id,
    get connected() {
      return connected;
    },

    connect() {
      if (!connected) {
        connected = true;
        queueMicrotask(() => {
          for (const fn of getSet(clientListeners, 'connect')) fn();
        });
      }
      return socket;
    },

    disconnect() {
      connected = false;
      for (const fn of getSet(clientListeners, 'disconnect')) fn();
      return socket;
    },

    on(event: string, fn: Listener) {
      getSet(clientListeners, event).add(fn);
      if (event === 'connect' && connected) {
        queueMicrotask(() => fn());
      }
      return socket;
    },

    once(event: string, fn: Listener) {
      const wrapped: Listener = (...args) => {
        getSet(clientListeners, event).delete(wrapped);
        fn(...args);
      };
      getSet(clientListeners, event).add(wrapped);
      return socket;
    },

    off(event: string, fn: Listener) {
      getSet(clientListeners, event).delete(fn);
      return socket;
    },

    emit(event: string, ...args: unknown[]) {
      for (const fn of getSet(serverListeners, event)) fn(...args);
      return socket;
    },

    listeners(event: string) {
      return [...getSet(clientListeners, event)];
    },

    onServer(event: string, fn: Listener) {
      getSet(serverListeners, event).add(fn);
    },
  };

  return socket as unknown as FakeSocketBrowser;
}
