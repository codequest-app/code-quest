import { randomUUID } from 'node:crypto';
import { basename } from 'node:path';
import { type Column, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { DrizzleDb } from './drizzle-types.ts';

interface ProjectsTable {
  id: Column;
  path: Column;
  name: Column;
  pinned: Column;
  color: Column;
  lastOpenedAt: Column;
  createdAt: Column;
}

export const projectRecordSchema: z.ZodObject<{
  id: z.ZodString;
  path: z.ZodString;
  name: z.ZodString;
  pinned: z.ZodBoolean;
  color: z.ZodNullable<z.ZodString>;
  lastOpenedAt: z.ZodString;
  createdAt: z.ZodString;
}> = z.object({
  id: z.string(),
  path: z.string(),
  name: z.string(),
  pinned: z.boolean(),
  color: z.string().nullable(),
  lastOpenedAt: z.string(),
  createdAt: z.string(),
});
export type ProjectRecord = z.infer<typeof projectRecordSchema>;

export interface ProjectPatch {
  name?: string;
  pinned?: boolean;
  color?: string | null;
}

export interface ProjectStore {
  /**
   * Insert new project (if path not seen) or update lastOpenedAt only (if path exists).
   * Never overwrites name/pinned/color on duplicate.
   */
  upsert(path: string): Promise<ProjectRecord>;
  /** All projects sorted: pinned first, then lastOpenedAt desc. */
  list(): Promise<ProjectRecord[]>;
  getById(id: string): Promise<ProjectRecord | null>;
  getByPath(path: string): Promise<ProjectRecord | null>;
  /** Patch only specified fields. Returns updated record, or null if id unknown. */
  update(id: string, patch: ProjectPatch): Promise<ProjectRecord | null>;
  /** Idempotent — no error for unknown id. */
  remove(id: string): Promise<void>;
}

export class DrizzleProjectStore implements ProjectStore {
  private db: DrizzleDb;
  private projects: ProjectsTable;
  constructor(db: DrizzleDb, projects: ProjectsTable) {
    this.db = db;
    this.projects = projects;
  }

  async upsert(path: string): Promise<ProjectRecord> {
    const existing = await this.getByPath(path);
    const now = new Date().toISOString();
    if (existing) {
      await this.db
        .update(this.projects)
        .set({ lastOpenedAt: now })
        .where(eq(this.projects.id, existing.id));
      return { ...existing, lastOpenedAt: now };
    }
    const record: ProjectRecord = {
      id: randomUUID(),
      path,
      name: basename(path) || path,
      pinned: false,
      color: null,
      lastOpenedAt: now,
      createdAt: now,
    };
    await this.db.insert(this.projects).values(record);
    return record;
  }

  async list(): Promise<ProjectRecord[]> {
    const rows = await this.db
      .select()
      .from(this.projects)
      .orderBy(desc(this.projects.pinned), desc(this.projects.lastOpenedAt));
    return z.array(projectRecordSchema).parse(rows);
  }

  async getById(id: string): Promise<ProjectRecord | null> {
    const rows = await this.db.select().from(this.projects).where(eq(this.projects.id, id));
    return projectRecordSchema.optional().parse(rows[0]) ?? null;
  }

  async getByPath(path: string): Promise<ProjectRecord | null> {
    const rows = await this.db.select().from(this.projects).where(eq(this.projects.path, path));
    return projectRecordSchema.optional().parse(rows[0]) ?? null;
  }

  async update(id: string, patch: ProjectPatch): Promise<ProjectRecord | null> {
    const existing = await this.getById(id);
    if (!existing) return null;
    const filtered: ProjectPatch = {};
    if (patch.name !== undefined) filtered.name = patch.name;
    if (patch.pinned !== undefined) filtered.pinned = patch.pinned;
    if (patch.color !== undefined) filtered.color = patch.color;
    if (Object.keys(filtered).length === 0) return existing;
    await this.db.update(this.projects).set(filtered).where(eq(this.projects.id, id));
    return { ...existing, ...filtered };
  }

  async remove(id: string): Promise<void> {
    await this.db.delete(this.projects).where(eq(this.projects.id, id));
  }
}
