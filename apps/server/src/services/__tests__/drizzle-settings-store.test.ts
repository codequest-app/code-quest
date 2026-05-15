import { settings } from '@code-quest/db-schema/sqlite';
import { describe, expect, it } from 'vitest';
import { createDatabase } from '../../db/sqlite-client.ts';
import { DrizzleSettingsStore } from '../drizzle-settings-store.ts';

function createStore() {
  const db = createDatabase(':memory:');
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    provider TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    PRIMARY KEY (provider, key)
  )`);
  return new DrizzleSettingsStore(db, settings);
}

describe('DrizzleSettingsStore', () => {
  it('get returns undefined for missing key', async () => {
    const store = createStore();
    expect(await store.get('claude', 'model')).toBeUndefined();
  });

  it('set and get round-trip', async () => {
    const store = createStore();
    await store.set('claude', 'model', 'opus');
    expect(await store.get('claude', 'model')).toBe('opus');
  });

  it('set overwrites existing value', async () => {
    const store = createStore();
    await store.set('claude', 'model', 'opus');
    await store.set('claude', 'model', 'sonnet');
    expect(await store.get('claude', 'model')).toBe('sonnet');
  });

  it('stores complex values as JSON', async () => {
    const store = createStore();
    const models = [{ value: 'default' }, { value: 'haiku' }];
    await store.set('claude', 'models', models);
    expect(await store.get('claude', 'models')).toEqual(models);
  });

  it('different providers are isolated', async () => {
    const store = createStore();
    await store.set('claude', 'model', 'opus');
    await store.set('gemini', 'model', 'pro');
    expect(await store.get('claude', 'model')).toBe('opus');
    expect(await store.get('gemini', 'model')).toBe('pro');
  });

  it('getMany returns only requested keys', async () => {
    const store = createStore();
    await store.set('claude', 'model', 'opus');
    await store.set('claude', 'permissionMode', 'default');
    await store.set('claude', 'models', [{ value: 'default' }]);

    const result = await store.getMany('claude', ['model', 'permissionMode']);
    expect(result).toEqual({ model: 'opus', permissionMode: 'default' });
    expect(result.models).toBeUndefined();
  });

  it('getMany returns empty object for no matches', async () => {
    const store = createStore();
    const result = await store.getMany('claude', ['model']);
    expect(result).toEqual({});
  });

  it('getMany scoped by provider', async () => {
    const store = createStore();
    await store.set('claude', 'model', 'opus');
    await store.set('gemini', 'model', 'pro');

    const result = await store.getMany('claude', ['model']);
    expect(result).toEqual({ model: 'opus' });
  });
});
