import { fanOutWrites } from './composite-fan-out.ts';
import type { SettingsStore } from './settings-store.ts';

/**
 * Fans `set` out to every backing store so multi-driver configs stay in sync.
 * Reads come from `stores[0]` — successful writes keep backends equal, so a
 * single authoritative read is enough.
 */
export class CompositeSettingsStore implements SettingsStore {
  constructor(private stores: SettingsStore[]) {
    if (stores.length === 0) {
      throw new Error('CompositeSettingsStore requires at least one store');
    }
  }

  get(provider: string, key: string): Promise<unknown> {
    return this.stores[0].get(provider, key);
  }

  getMany(provider: string, keys: string[]): Promise<Record<string, unknown>> {
    return this.stores[0].getMany(provider, keys);
  }

  async set(provider: string, key: string, value: unknown): Promise<void> {
    await fanOutWrites(this.stores, 'settings set', (s) => s.set(provider, key, value));
  }
}
