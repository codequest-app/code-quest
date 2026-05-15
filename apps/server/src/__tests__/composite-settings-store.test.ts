import { describe, expect, it, vi } from 'vitest';
import { CompositeSettingsStore } from '../services/composite-settings-store.ts';
import type { SettingsStore } from '../services/settings-store.ts';

function makeSpy(overrides: Partial<SettingsStore> = {}): SettingsStore {
  return {
    get: vi.fn(async () => undefined),
    set: vi.fn(async () => {}),
    getMany: vi.fn(async () => ({})),
    ...overrides,
  };
}

describe('CompositeSettingsStore', () => {
  it('throws when constructed with empty stores array', () => {
    expect(() => new CompositeSettingsStore([])).toThrow();
  });

  it('set fans out to all stores', async () => {
    const a = makeSpy();
    const b = makeSpy();
    const composite = new CompositeSettingsStore([a, b]);

    await composite.set('claude', 'model', 'sonnet');

    expect(a.set).toHaveBeenCalledWith('claude', 'model', 'sonnet');
    expect(b.set).toHaveBeenCalledWith('claude', 'model', 'sonnet');
  });

  it('get reads from stores[0] only', async () => {
    const a = makeSpy({ get: vi.fn(async () => 'from-A') });
    const b = makeSpy({ get: vi.fn(async () => 'from-B') });
    const composite = new CompositeSettingsStore([a, b]);

    const value = await composite.get('claude', 'model');

    expect(value).toBe('from-A');
    expect(a.get).toHaveBeenCalledWith('claude', 'model');
    expect(b.get).not.toHaveBeenCalled();
  });

  it('getMany reads from stores[0] only', async () => {
    const a = makeSpy({ getMany: vi.fn(async () => ({ model: 'sonnet' })) });
    const b = makeSpy({ getMany: vi.fn(async () => ({ model: 'haiku' })) });
    const composite = new CompositeSettingsStore([a, b]);

    const result = await composite.getMany('claude', ['model']);

    expect(result).toEqual({ model: 'sonnet' });
    expect(b.getMany).not.toHaveBeenCalled();
  });

  it('continues writing to other stores even if one fails', async () => {
    const failing = makeSpy({
      set: vi.fn(async () => {
        throw new Error('boom');
      }),
    });
    const healthy = makeSpy();
    const composite = new CompositeSettingsStore([failing, healthy]);

    await expect(composite.set('claude', 'model', 'x')).resolves.toBeUndefined();

    expect(failing.set).toHaveBeenCalledWith('claude', 'model', 'x');
    expect(healthy.set).toHaveBeenCalledWith('claude', 'model', 'x');
  });

  it('throws AggregateError when all stores fail', async () => {
    const f1 = makeSpy({
      set: vi.fn(async () => {
        throw new Error('fail-1');
      }),
    });
    const f2 = makeSpy({
      set: vi.fn(async () => {
        throw new Error('fail-2');
      }),
    });
    const composite = new CompositeSettingsStore([f1, f2]);

    await expect(composite.set('claude', 'model', 'x')).rejects.toThrow(AggregateError);
  });
});
