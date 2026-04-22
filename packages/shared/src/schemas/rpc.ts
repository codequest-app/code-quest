import { z } from 'zod';

/**
 * Standard ack shape for every RPC (socket.io emit + callback).
 *
 *   Success: { ok: true, data: T }
 *   Failure: { ok: false, error: string, code?: string }
 *
 * `error` is a user-facing message. `code` is an optional machine-readable
 * classifier for programmatic handling (e.g. "session_not_found").
 */

/** Single source of truth for the failure shape — inferred below. */
const rpcErrSchema = z.object({
  ok: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
});

export type RpcErr = z.infer<typeof rpcErrSchema>;
export type RpcOk<T> = { ok: true; data: T };
export type RpcResult<T> = RpcOk<T> | RpcErr;

/** Ack — void RPC result. Use instead of `RpcResult<Record<string, never>>`
 *  for RPCs whose success payload carries no data (only ok/error status). */
export type Ack = RpcResult<Record<string, never>>;

/**
 * Build a zod schema for an RpcResult whose success payload matches the given
 * data schema. Returns a discriminated union on `ok`.
 */
export function rpcResult<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.discriminatedUnion('ok', [
    z.object({ ok: z.literal(true), data: dataSchema }),
    rpcErrSchema,
  ]);
}
