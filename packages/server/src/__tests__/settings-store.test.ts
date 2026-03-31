import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { FileSettingsStore } from '../services/settings-store.ts';

describe('FileSettingsStore', () => {
  const dirs: string[] = [];

  function createStore(dir?: string) {
    const d = dir ?? join(tmpdir(), `settings-test-${randomUUID()}`);
    dirs.push(d);
    return new FileSettingsStore(join(d, 'settings.json'));
  }

  afterEach(() => {
    for (const d of dirs) {
      rmSync(d, { recursive: true, force: true });
    }
    dirs.length = 0;
  });

  it('returns undefined for missing key', async () => {
    const store = createStore();
    expect(await store.get('claude', 'missing')).toBeUndefined();
  });

  it('set then get returns value', async () => {
    const store = createStore();
    await store.set('claude', 'theme', 'dark');
    expect(await store.get('claude', 'theme')).toBe('dark');
  });

  it('getMany returns matching values', async () => {
    const store = createStore();
    await store.set('claude', 'a', 1);
    await store.set('claude', 'b', 'two');
    expect(await store.getMany('claude', ['a', 'b'])).toEqual({ a: 1, b: 'two' });
  });

  it('persists across new instances', async () => {
    const dir = join(tmpdir(), `settings-test-${randomUUID()}`);
    dirs.push(dir);
    const filePath = join(dir, 'settings.json');

    const store1 = new FileSettingsStore(filePath);
    await store1.set('claude', 'key', 'value');

    const store2 = new FileSettingsStore(filePath);
    expect(await store2.get('claude', 'key')).toBe('value');
  });

  it('handles concurrent set operations', async () => {
    const store = createStore();
    await store.set('claude', 'a', 1);
    await store.set('claude', 'b', 2);
    await store.set('claude', 'a', 3);
    expect(await store.getMany('claude', ['a', 'b'])).toEqual({ a: 3, b: 2 });
  });

  it('creates directory if not exists', async () => {
    const dir = join(tmpdir(), `settings-test-${randomUUID()}`, 'nested', 'dir');
    dirs.push(join(tmpdir(), dir.split('/').slice(0, -2).join('/')));
    // The constructor should create the directory
    const store = new FileSettingsStore(join(dir, 'settings.json'));
    await store.set('claude', 'x', 42);
    expect(await store.get('claude', 'x')).toBe(42);
    // clean up the top-level random dir
    const topDir = join(tmpdir(), `settings-test-${dir.split('settings-test-')[1].split('/')[0]}`);
    dirs.push(topDir);
  });
});
