export interface SessionRow {
  id: string;
  provider: string;
  command: string;
  args: string;
  cwd: string | null;
  mode: string;
  createdAt: string;
}

export interface EventRow {
  sessionId: string;
  dir: string;
  type: string;
  data: string;
  createdAt: string;
}

export interface ChatLogRepository {
  insertSession(row: SessionRow): void | Promise<void>;
  insertEvent(row: EventRow): void | Promise<void>;
}
