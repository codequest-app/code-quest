import type { ClientToServerEvents } from '@code-quest/shared';
import type { TypedSocket } from './client';

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
    (socket.emit as (...a: unknown[]) => unknown)(event, ...args, resolve);
  });
}
