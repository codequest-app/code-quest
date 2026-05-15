import type { ClientToServerEvents } from '@code-quest/schemas';
import type { SocketLike, TypedSocket } from './client.ts';

function emitDynamic(socket: TypedSocket, ...args: unknown[]): void {
  (socket as SocketLike).emit(args[0] as string, ...args.slice(1));
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
const RPC_TIMEOUT_MS = 10_000;

export function rpc<E extends keyof ClientToServerEvents>(
  socket: TypedSocket,
  event: E,
  ...args: Parameters<ClientToServerEvents[E]> extends [...infer P, infer _Cb] ? P : never
): Promise<
  Parameters<ClientToServerEvents[E]> extends [...infer _P, (res: infer R) => void] ? R : never
> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`rpc timeout: ${event}`)), RPC_TIMEOUT_MS);
    // Cast needed: generic rpc() destructures event args at type level but Socket.IO's
    // emit overloads can't express this pattern without an escape hatch.
    emitDynamic(socket, event, ...args, (res: unknown) => {
      clearTimeout(timer);
      resolve(res as never);
    });
  });
}
