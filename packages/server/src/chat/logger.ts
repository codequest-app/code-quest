export interface ChatLogEntry {
  dir: 'in' | 'out';
  type: string;
  data: unknown;
}

export interface SessionMetadata {
  provider: string;
  command: string;
  args: string[];
  cwd?: string;
  mode: string;
}

export interface ChatLogger {
  createSession(sessionId: string, metadata: SessionMetadata): void;
  log(sessionId: string, entry: ChatLogEntry): void;
  close(sessionId: string): void;
}
