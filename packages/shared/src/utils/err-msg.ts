/**
 * Extract a human-readable message from an unknown thrown value.
 *
 * - If `err` is an `Error`, return its `.message`.
 * - Otherwise, if `fallback` is provided, return it.
 * - Otherwise, coerce via `String(err)`.
 */
export function errMsg(err: unknown, fallback?: string): string {
  if (err instanceof Error) return err.message;
  return fallback ?? String(err);
}
