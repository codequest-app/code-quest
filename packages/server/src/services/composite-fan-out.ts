import { logger } from '../logger.ts';

/**
 * Shared composite write pattern used by Composite{Raw{Event,Delta},Session,Settings}Store:
 * run `op` on every store in parallel, swallow partial failures with a log,
 * rethrow as AggregateError only when every store fails.
 */
export async function fanOutWrites<T>(
  stores: T[],
  label: string,
  op: (store: T) => Promise<unknown>,
): Promise<void> {
  const results = await Promise.allSettled(stores.map(op));
  const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
  if (failures.length === 0) return;
  if (failures.length < results.length) {
    for (const f of failures) {
      logger.error({ err: f.reason }, `Partial ${label} failure`);
    }
    return;
  }
  throw new AggregateError(
    failures.map((r) => r.reason),
    `All stores failed: ${label}`,
  );
}
