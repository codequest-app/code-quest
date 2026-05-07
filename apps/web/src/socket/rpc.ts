import type { ClientToServerEvents } from '@code-quest/shared';
import type { TypedSocket } from './client.ts';

/** Typed socket.emit requires known event literals; dynamic event names need this helper. */
function emitDynamic(socket: TypedSocket, ...args: unknown[]): void {
  (socket.emit as (...a: unknown[]) => unknown)(...args);
}

/**
 * Emit a socket event with channelId injected into the payload.
 * Bypasses Socket.IO typed-emit constraints for dynamic event names.
 */
export function channelEmit(
  socket: TypedSocket,
  channelId: string,
  event: string,
  payload: Record<string, unknown>,
  ...rest: unknown[]
): void {
  emitDynamic(socket, event, { channelId, ...payload }, ...rest);
}

/**
 * Promise-based wrapper around socket.emit with callback.
 * Sends a typed event and resolves with the server's callback response.
 */
export function rpc<E extends keyof ClientToServerEvents>(
  socket: TypedSocket,
  event: E,
  ...args: Parameters<ClientToServerEvents[E]> extends [...infer P, infer _Cb] ? P : never
): Promise<
  Parameters<ClientToServerEvents[E]> extends [...infer _P, (res: infer R) => void] ? R : never
> {
  return new Promise((resolve) => {
    // Cast needed: generic rpc() destructures event args at type level but Socket.IO's
    // emit overloads can't express this pattern without an escape hatch.
    emitDynamic(socket, event, ...args, resolve);
  });
}
