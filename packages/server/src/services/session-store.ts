import { z } from 'zod';

export const sessionRecordSchema = z.looseObject({
  id: z.string(),
  channelId: z.string(),
  provider: z.string(),
  command: z.string(),
  args: z.string(),
  cwd: z.string().nullable().optional(),
  projectRoot: z.string(),
  mode: z.string(),
  role: z.string(),
  parentId: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type SessionRecord = z.infer<typeof sessionRecordSchema>;

export interface SessionStore {
  /** Insert a new row, or on duplicate `id`: rebind `channelId`, reset `status='active'`,
   *  and overwrite `parentId` when the new record carries one. */
  upsert(record: SessionRecord): Promise<void>;
  list(opts?: {
    limit?: number;
    offset?: number;
    cwd?: string;
    hasParentId?: boolean;
    /** Omit rows whose `id` (sessionId) is in the array. Empty array = no filter. */
    excludeSessionIds?: string[];
  }): Promise<{ sessions: SessionRecord[]; total: number }>;
  /** Lookup by primary key (sessionId). */
  getById(id: string): Promise<SessionRecord | null>;
  /** Bridge lookup by the indexed `channel_id` column. Callers then operate by `record.id`. */
  getByChannelId(channelId: string): Promise<SessionRecord | null>;
  rename(id: string, title: string): Promise<boolean>;
  updateStatus(id: string, status: string): Promise<boolean>;
  delete(id: string): Promise<boolean>;
  renameByChannelId(channelId: string, title: string): Promise<boolean>;
  updateStatusByChannelId(channelId: string, status: string): Promise<boolean>;
  deleteByChannelId(channelId: string): Promise<boolean>;
}
