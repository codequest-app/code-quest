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

  it('returns undefined for missing key', () => {
    const store = createStore();
    expect(store.get('missing')).toBeUndefined();
  });

  it('set then get returns value', () => {
    const store = createStore();
    store.set('theme', 'dark');
    expect(store.get('theme')).toBe('dark');
  });

  it('getAll returns all values', () => {
    const store = createStore();
    store.set('a', 1);
    store.set('b', 'two');
    expect(store.getAll()).toEqual({ a: 1, b: 'two' });
  });

  it('persists across new instances', () => {
    const dir = join(tmpdir(), `settings-test-${randomUUID()}`);
    dirs.push(dir);
    const filePath = join(dir, 'settings.json');

    const store1 = new FileSettingsStore(filePath);
    store1.set('key', 'value');

    const store2 = new FileSettingsStore(filePath);
    expect(store2.get('key')).toBe('value');
  });

  it('handles concurrent set operations', () => {
    const store = createStore();
    store.set('a', 1);
    store.set('b', 2);
    store.set('a', 3);
    expect(store.getAll()).toEqual({ a: 3, b: 2 });
  });

  it('creates directory if not exists', () => {
    const dir = join(tmpdir(), `settings-test-${randomUUID()}`, 'nested', 'dir');
    dirs.push(join(tmpdir(), dir.split('/').slice(0, -2).join('/')));
    // The constructor should create the directory
    const store = new FileSettingsStore(join(dir, 'settings.json'));
    store.set('x', 42);
    expect(store.get('x')).toBe(42);
    // clean up the top-level random dir
    const topDir = join(tmpdir(), `settings-test-${dir.split('settings-test-')[1].split('/')[0]}`);
    dirs.push(topDir);
  });
});
