import { CompositeStore } from './composite-store.ts';
import type { SettingsStore } from './settings-store.ts';

export class CompositeSettingsStore extends CompositeStore<SettingsStore> implements SettingsStore {
  get(provider: string, key: string): Promise<unknown> {
    return this.primary.get(provider, key);
  }

  getMany(provider: string, keys: string[]): Promise<Record<string, unknown>> {
    return this.primary.getMany(provider, keys);
  }

  async set(provider: string, key: string, value: unknown): Promise<void> {
    await this.fanOut('settings set', (s) => s.set(provider, key, value));
  }
}
