export interface SessionRecord {
  id: string;
  provider: string;
  command: string;
  args: string;
  cwd?: string;
  mode: string;
  role: string;
  parentId?: string;
  sessionId?: string;
  title?: string;
  status?: string;
  createdAt: string;
}

export interface SessionStore {
  persist(record: SessionRecord): Promise<void>;
  list(opts?: {
    limit?: number;
    offset?: number;
    cwd?: string;
  }): Promise<{ sessions: SessionRecord[]; total: number }>;
  getById(id: string): Promise<SessionRecord | null>;
  rename(id: string, title: string): Promise<boolean>;
  updateStatus(id: string, status: string): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}
