export interface SessionRecord {
  id: string;
  provider: string;
  command: string;
  args: string;
  cwd?: string;
  mode: string;
  role: string;
  parentId?: string;
  createdAt: string;
}

export interface SessionStore {
  persist(record: SessionRecord): Promise<void>;
}
