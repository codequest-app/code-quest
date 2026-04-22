import { logger } from '../logger.ts';
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
    const results = await Promise.allSettled(this.stores.map((s) => s.set(provider, key, value)));
    const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (failures.length === 0) return;
    if (failures.length < results.length) {
      for (const f of failures) {
        logger.error({ err: f.reason }, 'Partial settings set failure');
      }
      return;
    }
    throw new AggregateError(
      failures.map((r) => r.reason),
      'All settings stores failed to set',
    );
  }
}
