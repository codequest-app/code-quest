import { describe, expect, it, vi } from 'vitest';
import { CachedDataSource } from '../cached.ts';
import type { DataSource } from '../types.ts';

function makeInner<T>(value: T): DataSource<T> & { callCount: number; notifyChange(): void } {
  let callCount = 0;
  const callbacks = new Set<() => void>();
  return {
    get callCount() {
      return callCount;
    },
    async read() {
      callCount++;
      return value;
    },
    onChange(cb) {
      callbacks.add(cb);
      return () => callbacks.delete(cb);
    },
    notifyChange() {
      for (const cb of callbacks) cb();
    },
  };
}

describe('CachedDataSource', () => {
  it('first read delegates to inner', async () => {
    const inner = makeInner('hello');
    const cached = new CachedDataSource(inner);
    const result = await cached.read();
    expect(result).toBe('hello');
    expect(inner.callCount).toBe(1);
  });

  it('second read returns cached value without calling inner again', async () => {
    const inner = makeInner('hello');
    const cached = new CachedDataSource(inner);
    await cached.read();
    await cached.read();
    expect(inner.callCount).toBe(1);
  });

  it('onChange from inner invalidates cache so next read calls inner again', async () => {
    const inner = makeInner('hello');
    const cached = new CachedDataSource(inner);
    await cached.read();
    inner.notifyChange();
    await cached.read();
    expect(inner.callCount).toBe(2);
  });

  it('multiple rapid onChange signals result in only one read on next access', async () => {
    const inner = makeInner('hello');
    const cached = new CachedDataSource(inner);
    await cached.read();
    inner.notifyChange();
    inner.notifyChange();
    inner.notifyChange();
    await cached.read();
    expect(inner.callCount).toBe(2);
  });

  it('concurrent reads share the same pending promise', async () => {
    const inner = makeInner('hello');
    const cached = new CachedDataSource(inner);
    const [a, b] = await Promise.all([cached.read(), cached.read()]);
    expect(a).toBe('hello');
    expect(b).toBe('hello');
    expect(inner.callCount).toBe(1);
  });

  it('propagates onChange to registered listeners', async () => {
    const inner = makeInner(42);
    const cached = new CachedDataSource(inner);
    const listener = vi.fn();
    cached.onChange(listener);
    inner.notifyChange();
    expect(listener).toHaveBeenCalledOnce();
  });

  it('dispose() calls inner.dispose()', () => {
    const dispose = vi.fn();
    const inner = { ...makeInner(1), dispose };
    const cached = new CachedDataSource(inner);
    cached.dispose();
    expect(dispose).toHaveBeenCalledTimes(1);
  });

  it('unsubscribed listener no longer receives onChange', async () => {
    const inner = makeInner(42);
    const cached = new CachedDataSource(inner);
    const listener = vi.fn();
    const off = cached.onChange(listener);
    off();
    inner.notifyChange();
    expect(listener).not.toHaveBeenCalled();
  });
});
