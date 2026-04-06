import { z } from 'zod';

export const sessionRecordSchema = z.looseObject({
  id: z.string(),
  provider: z.string(),
  command: z.string(),
  args: z.string(),
  cwd: z.string().nullable().optional(),
  mode: z.string(),
  role: z.string(),
  parentId: z.string().nullable().optional(),
  sessionId: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type SessionRecord = z.infer<typeof sessionRecordSchema>;

export interface SessionStore {
  persist(record: SessionRecord): Promise<void>;
  list(opts?: {
    limit?: number;
    offset?: number;
    cwd?: string;
    hasParentId?: boolean;
  }): Promise<{ sessions: SessionRecord[]; total: number }>;
  getById(id: string): Promise<SessionRecord | null>;
  rename(id: string, title: string): Promise<boolean>;
  updateStatus(id: string, status: string): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}
