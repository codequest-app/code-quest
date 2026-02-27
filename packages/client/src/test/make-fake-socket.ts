import { EventEmitter } from 'node:events';
import type { TypedSocket } from '../socket/client';

export function makeFakeSocket({ sessionId = 'session-1' } = {}) {
  const emitter = new EventEmitter();
  const socket = {
    connected: false,
    connect() {
      socket.connected = true;
      emitter.emit('connect');
    },
    disconnect() {
      socket.connected = false;
      emitter.emit('disconnect');
    },
    on(event: string, fn: (...args: unknown[]) => void) {
      emitter.on(event, fn);
      return socket;
    },
    off(event: string, fn: (...args: unknown[]) => void) {
      emitter.off(event, fn);
      return socket;
    },
    emit(event: string, ...args: unknown[]) {
      if (event === 'chat:create' && typeof args[1] === 'function') {
        (args[1] as (res: { sessionId: string }) => void)({ sessionId });
      }
    },
    _emitter: emitter,
  };
  vi.spyOn(socket, 'connect');
  vi.spyOn(socket, 'emit');
  vi.spyOn(socket, 'off');
  return socket as typeof socket & TypedSocket;
}
