import { EventEmitter } from 'node:events';

let _socketSeq = 0;

interface FakeServerSocket {
  id: string;
  emit(event: string, ...args: unknown[]): FakeServerSocket;
  on(event: string, fn: (...args: unknown[]) => unknown): FakeServerSocket;
  off(event: string, fn: (...args: unknown[]) => void): FakeServerSocket;
  readonly lastHandlerPromise: Promise<unknown> | null;
}

export interface FakeSocket {
  id: string;
  connected: boolean;
  serverSocket: FakeServerSocket;
  connect(): FakeSocket;
  disconnect(): FakeSocket;
  on(event: string, fn: (...args: unknown[]) => void): FakeSocket;
  once(event: string, fn: (...args: unknown[]) => void): FakeSocket;
  off(event: string, fn: (...args: unknown[]) => void): FakeSocket;
  emit(event: string, ...args: unknown[]): FakeSocket;
  // biome-ignore lint/complexity/noBannedTypes: EventEmitter.listeners() returns Function[]
  listeners(event: string): Function[];
}

/**
 * Create a dual-emitter fake socket (client ↔ server).
 * Used by vi.mock('socket.io-client') in both client and server test setups.
 *
 * server → client: async (queueMicrotask) — matches real socket.io network delivery
 * client → server: sync — callback pattern needs immediate response
 */
export function createFakeSocket(): FakeSocket {
  const socketId = `fake-socket-${++_socketSeq}`;
  const clientEmitter = new EventEmitter();
  const serverEmitter = new EventEmitter();

  // Track last handler Promise for send() to await
  let _lastHandlerPromise: Promise<unknown> | null = null;
  type AnyFn = (...args: unknown[]) => unknown;
  const _wrapperMap = new WeakMap<AnyFn, AnyFn>();

  const serverSocket = {
    id: socketId,
    emit(event: string, ...args: unknown[]) {
      // Async delivery: server → client (like real socket.io network I/O)
      queueMicrotask(() => clientEmitter.emit(event, ...args));
      return serverSocket;
    },
    on(event: string, fn: (...args: unknown[]) => unknown) {
      // Wrap handler to capture async return value
      const wrapped = (...args: unknown[]) => {
        const result = fn(...args);
        _lastHandlerPromise = result instanceof Promise ? result : Promise.resolve(result);
      };
      _wrapperMap.set(fn, wrapped);
      serverEmitter.on(event, wrapped);
      return serverSocket;
    },
    off(event: string, fn: (...args: unknown[]) => void) {
      const wrapped = _wrapperMap.get(fn);
      serverEmitter.off(event, (wrapped ?? fn) as (...args: unknown[]) => void);
      return serverSocket;
    },
    /** Await the last async handler's Promise */
    get lastHandlerPromise() {
      return _lastHandlerPromise;
    },
  };

  const socket = {
    id: socketId,
    connected: true,
    serverSocket,
    connect() {
      if (!socket.connected) {
        socket.connected = true;
        clientEmitter.emit('connect');
      }
      return socket;
    },
    disconnect() {
      socket.connected = false;
      clientEmitter.emit('disconnect');
      return socket;
    },
    on(event: string, fn: (...args: unknown[]) => void) {
      clientEmitter.on(event, fn);
      // Auto-fire connect handler if already connected (like socket.io autoConnect)
      if (event === 'connect' && socket.connected) {
        queueMicrotask(() => fn());
      }
      return socket;
    },
    once(event: string, fn: (...args: unknown[]) => void) {
      clientEmitter.once(event, fn);
      return socket;
    },
    off(event: string, fn: (...args: unknown[]) => void) {
      clientEmitter.off(event, fn);
      return socket;
    },
    emit(event: string, ...args: unknown[]) {
      // Sync delivery: client → server
      _lastHandlerPromise = null;
      serverEmitter.emit(event, ...args);
      return socket;
    },
    listeners(event: string) {
      return clientEmitter.listeners(event);
    },
  };

  return socket;
}

// FakeSocket is now exported as an interface above
