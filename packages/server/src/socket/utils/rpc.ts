import type { RpcResult } from '@code-quest/shared';

/** Build a success ack: `{ ok: true, data }`. */
export function ok<T>(data: T): RpcResult<T> {
  return { ok: true, data };
}

/** Build a failure ack: `{ ok: false, error, code? }`. */
export function err(error: string, code?: string): RpcResult<never> {
  return code !== undefined ? { ok: false, error, code } : { ok: false, error };
}
