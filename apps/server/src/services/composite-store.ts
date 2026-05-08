import { logger } from '../logger.ts';

export abstract class CompositeStore<T> {
  protected readonly primary: T;
  protected readonly stores: T[];

  constructor(stores: T[]) {
    if (stores.length === 0) throw new Error('CompositeStore requires at least one store');
    this.stores = stores;
    this.primary = stores[0] as T;
  }

  protected async fanOut(
    label: string,
    op: (store: T) => Promise<unknown>,
    stores?: T[],
  ): Promise<void> {
    await this.fanOutCollect(label, op, () => undefined, stores);
  }

  protected async fanOutCollect<R>(
    label: string,
    op: (store: T) => Promise<R>,
    reduce: (results: R[]) => R,
    stores: T[] = this.stores,
  ): Promise<R> {
    const settled = await Promise.allSettled(stores.map(op));
    const values: R[] = [];
    const failures: PromiseRejectedResult[] = [];
    for (const r of settled) {
      if (r.status === 'fulfilled') values.push(r.value);
      else failures.push(r);
    }
    for (const f of failures) {
      logger.error({ err: f.reason }, `Partial ${label} failure`);
    }
    if (values.length === 0) {
      throw new AggregateError(
        failures.map((r) => r.reason),
        `All stores failed: ${label}`,
      );
    }
    return reduce(values);
  }
}
