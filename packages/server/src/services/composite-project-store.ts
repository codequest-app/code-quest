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
  private readonly primary: ProjectStore;
  private stores: ProjectStore[];
  constructor(stores: ProjectStore[]) {
    if (stores.length === 0) {
      throw new Error('CompositeProjectStore requires at least one store');
    }
    this.stores = stores;
    this.primary = stores[0] as ProjectStore;
  }

  async list(): Promise<ProjectRecord[]> {
    return this.primary.list();
  }

  async getById(id: string): Promise<ProjectRecord | null> {
    return this.primary.getById(id);
  }

  async getByPath(path: string): Promise<ProjectRecord | null> {
    return this.primary.getByPath(path);
  }

  async upsert(path: string): Promise<ProjectRecord> {
    const result = await this.primary.upsert(path);
    if (this.stores.length > 1) {
      await fanOutWrites(this.stores.slice(1), 'project upsert (secondary)', (s) =>
        s.upsert(path),
      ).catch((err) => logger.error({ err }, 'Secondary project upsert failed'));
    }
    return result;
  }

  async update(id: string, patch: ProjectPatch): Promise<ProjectRecord | null> {
    const result = await this.primary.update(id, patch);
    if (this.stores.length > 1) {
      if (result) {
        await fanOutWrites(this.stores.slice(1), 'project update (secondary)', async (s) => {
          const secRow = await s.getByPath(result.path);
          if (secRow) await s.update(secRow.id, patch);
        }).catch((err) => logger.error({ err }, 'Secondary project update failed'));
      }
    }
    return result;
  }

  async remove(id: string): Promise<void> {
    const target = await this.primary.getById(id);
    await this.primary.remove(id);
    if (this.stores.length > 1 && target) {
      await fanOutWrites(this.stores.slice(1), 'project remove (secondary)', async (s) => {
        const secRow = await s.getByPath(target.path);
        if (secRow) await s.remove(secRow.id);
      }).catch((err) => logger.error({ err }, 'Secondary project remove failed'));
    }
  }
}
