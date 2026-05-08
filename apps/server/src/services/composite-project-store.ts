import { CompositeStore } from './composite-store.ts';
import type { ProjectPatch, ProjectRecord, ProjectStore } from './project-store.ts';

export class CompositeProjectStore extends CompositeStore<ProjectStore> implements ProjectStore {
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
    await this.fanOut('project upsert', (s) => s.upsert(path), this.stores.slice(1));
    return result;
  }

  async update(id: string, patch: ProjectPatch): Promise<ProjectRecord | null> {
    const result = await this.primary.update(id, patch);
    if (result) {
      await this.fanOut(
        'project update',
        async (s) => {
          const secRow = await s.getByPath(result.path);
          if (secRow) await s.update(secRow.id, patch);
        },
        this.stores.slice(1),
      );
    }
    return result;
  }

  async remove(id: string): Promise<void> {
    const target = await this.primary.getById(id);
    await this.primary.remove(id);
    if (target) {
      await this.fanOut(
        'project remove',
        async (s) => {
          const secRow = await s.getByPath(target.path);
          if (secRow) await s.remove(secRow.id);
        },
        this.stores.slice(1),
      );
    }
  }
}
