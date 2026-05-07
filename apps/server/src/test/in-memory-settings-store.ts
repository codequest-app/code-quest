import type { SettingsStore } from '../services/settings-store.ts';

/**
 * Test-only in-memory SettingsStore. Do not bundle into production — use
 * FileSettingsStore or DrizzleSettingsStore instead.
 */
export class InMemorySettingsStore implements SettingsStore {
  private data = new Map<string, unknown>();

  private mapKey(provider: string, key: string): string {
    return `${provider}:${key}`;
  }

  async get(provider: string, key: string): Promise<unknown> {
    return this.data.get(this.mapKey(provider, key));
  }

  async set(provider: string, key: string, value: unknown): Promise<void> {
    this.data.set(this.mapKey(provider, key), value);
  }

  async getMany(provider: string, keys: string[]): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {};
    for (const key of keys) {
      const value = this.data.get(this.mapKey(provider, key));
      if (value !== undefined) result[key] = value;
    }
    return result;
  }
}
