import type { DataSource, Unsubscribe } from './types.ts';

export class CachedDataSource<T> {
  private cache: T | null = null;
  private pending: Promise<T> | null = null;
  private readonly callbacks = new Set<() => void>();
  private readonly unsub: Unsubscribe;
  private readonly inner: DataSource<T>;

  constructor(inner: DataSource<T>) {
    this.inner = inner;
    this.unsub = inner.onChange(() => {
      this.cache = null;
      this.pending = null;
      for (const cb of this.callbacks) cb();
    });
  }

  async read(): Promise<T> {
    if (this.cache !== null) return this.cache;
    if (this.pending) return this.pending;
    this.pending = this.inner.read().then((v) => {
      this.cache = v;
      this.pending = null;
      return v;
    });
    return this.pending;
  }

  onChange(cb: () => void): Unsubscribe {
    this.callbacks.add(cb);
    return () => this.callbacks.delete(cb);
  }

  dispose(): void {
    this.unsub();
    this.inner.dispose?.();
  }
}
