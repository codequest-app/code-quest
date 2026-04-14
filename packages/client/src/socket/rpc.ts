import type { ClientToServerEvents, RpcResult } from '@code-quest/shared';
import type { TypedSocket } from './client';

/** Thrown by `call()` when server acks with `{ ok: false, ... }`. */
export class RpcError extends Error {
  readonly code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'RpcError';
    this.code = code;
  }
}

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

/**
 * Promise-based rpc with channelId injected into the payload.
 */
export function channelRpc<T = unknown>(
  socket: TypedSocket,
  channelId: string,
  event: string,
  payload: Record<string, unknown>,
): Promise<T> {
  return new Promise((resolve) => {
    emitDynamic(socket, event, { channelId, ...payload }, resolve);
  });
}

/**
 * Higher-level rpc wrapper: unwraps an RpcResult<T> ack.
 * Returns the success data, throws RpcError on failure.
 *
 * Prefer this over raw `rpc()` unless you need to branch on failure manually.
 */
export async function call<E extends keyof ClientToServerEvents>(
  socket: TypedSocket,
  event: E,
  ...args: Parameters<ClientToServerEvents[E]> extends [...infer P, infer _Cb] ? P : never
): Promise<
  Parameters<ClientToServerEvents[E]> extends [...infer _P, (res: RpcResult<infer T>) => void]
    ? T
    : never
> {
  const result = (await rpc(socket, event, ...(args as never))) as RpcResult<unknown>;
  if (!result.ok) {
    throw new RpcError(result.error, result.code);
  }
  return result.data as never;
}
