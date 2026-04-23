import { logger } from '../logger.ts';
import { fanOutWrites } from './composite-fan-out.ts';
import type { ProjectPatch, ProjectRecord, ProjectStore } from './project-store.ts';

/**
 * Fan-out writes to all stores; reads + return values from stores[0] (canonical).
 * Path uniqueness is enforced per-backend; divergence on `path` is impossible
 * after a successful fan-out. `id` may differ between backends but UI keys off
 * `path`, so this is benign.
 */
export class CompositeProjectStore implements ProjectStore {
  constructor(private stores: ProjectStore[]) {
    if (stores.length === 0) {
      throw new Error('CompositeProjectStore requires at least one store');
    }
  }

  async list(): Promise<ProjectRecord[]> {
    return this.stores[0].list();
  }

  async getById(id: string): Promise<ProjectRecord | null> {
    return this.stores[0].getById(id);
  }

  async getByPath(path: string): Promise<ProjectRecord | null> {
    return this.stores[0].getByPath(path);
  }

  async upsert(path: string): Promise<ProjectRecord> {
    const primary = await this.stores[0].upsert(path);
    if (this.stores.length > 1) {
      // Fan-out to secondaries; partial failure logged but does not block primary.
      await fanOutWrites(this.stores.slice(1), 'project upsert (secondary)', (s) =>
        s.upsert(path),
      ).catch((err) => logger.error({ err }, 'Secondary project upsert failed'));
    }
    return primary;
  }

  async update(id: string, patch: ProjectPatch): Promise<ProjectRecord | null> {
    const primary = await this.stores[0].update(id, patch);
    if (this.stores.length > 1) {
      // Secondaries may have different ids — look up by primary's path.
      if (primary) {
        await fanOutWrites(this.stores.slice(1), 'project update (secondary)', async (s) => {
          const secRow = await s.getByPath(primary.path);
          if (secRow) await s.update(secRow.id, patch);
        }).catch((err) => logger.error({ err }, 'Secondary project update failed'));
      }
    }
    return primary;
  }

  async remove(id: string): Promise<void> {
    const primary = await this.stores[0].getById(id);
    await this.stores[0].remove(id);
    if (this.stores.length > 1 && primary) {
      await fanOutWrites(this.stores.slice(1), 'project remove (secondary)', async (s) => {
        const secRow = await s.getByPath(primary.path);
        if (secRow) await s.remove(secRow.id);
      }).catch((err) => logger.error({ err }, 'Secondary project remove failed'));
    }
  }
}
