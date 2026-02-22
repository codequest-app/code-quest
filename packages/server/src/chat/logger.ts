export interface ChatLogEntry {
  dir: 'in' | 'out';
  type: string;
  data: unknown;
}

export interface ChatLogger {
  log(sessionId: string, entry: ChatLogEntry): void;
  close(sessionId: string): void;
}
