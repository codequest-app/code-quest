import { describe, expect, it } from 'vitest';
import { getOrSet } from '../utils/get-or-set.ts';

describe('getOrSet', () => {
  it('calls factory and returns result on cache miss', async () => {
    const map = new Map<string, Promise<number>>();
    const result = await getOrSet(map, 'a', () => Promise.resolve(42));
    expect(result).toBe(42);
  });

  it('returns existing promise on cache hit', async () => {
    const map = new Map<string, Promise<number>>();
    let callCount = 0;
    const factory = () => {
      callCount++;
      return Promise.resolve(99);
    };
    const p1 = getOrSet(map, 'a', factory);
    const p2 = getOrSet(map, 'a', factory);
    expect(p1).toBe(p2);
    expect(callCount).toBe(1);
    expect(await p2).toBe(99);
  });

  it('removes key from map after promise resolves', async () => {
    const map = new Map<string, Promise<number>>();
    await getOrSet(map, 'a', () => Promise.resolve(1));
    expect(map.has('a')).toBe(false);
  });

  it('removes key from map after promise rejects', async () => {
    const map = new Map<string, Promise<number>>();
    await getOrSet(map, 'a', () => Promise.reject(new Error('boom'))).catch(() => {});
    expect(map.has('a')).toBe(false);
  });

  it('isolates different keys', async () => {
    const map = new Map<string, Promise<string>>();
    const a = getOrSet(map, 'x', () => Promise.resolve('X'));
    const b = getOrSet(map, 'y', () => Promise.resolve('Y'));
    expect(await a).toBe('X');
    expect(await b).toBe('Y');
  });
});
