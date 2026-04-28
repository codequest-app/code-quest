import { fanOutWrites } from './composite-fan-out.ts';
import type { SettingsStore } from './settings-store.ts';

/**
 * Fans `set` out to every backing store so multi-driver configs stay in sync.
 * Reads come from `stores[0]` — successful writes keep backends equal, so a
 * single authoritative read is enough.
 */
export class CompositeSettingsStore implements SettingsStore {
  private readonly primary: SettingsStore;
  private stores: SettingsStore[];
  constructor(stores: SettingsStore[]) {
    if (stores.length === 0) {
      throw new Error('CompositeSettingsStore requires at least one store');
    }
    this.stores = stores;
    this.primary = stores[0] as SettingsStore;
  }

  get(provider: string, key: string): Promise<unknown> {
    return this.primary.get(provider, key);
  }

  getMany(provider: string, keys: string[]): Promise<Record<string, unknown>> {
    return this.primary.getMany(provider, keys);
  }

  async set(provider: string, key: string, value: unknown): Promise<void> {
    await fanOutWrites(this.stores, 'settings set', (s) => s.set(provider, key, value));
  }
}
