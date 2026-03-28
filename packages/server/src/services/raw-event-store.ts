import type { RawEntry } from '@code-quest/summoner';

export interface SessionPreview {
  firstUser?: string;
  lastAssistant?: string;
}

export interface RawEventStore {
  append(entry: RawEntry): Promise<void>;
  getBySession(sessionId: string): Promise<RawEntry[]>;
  getPreview(sessionId: string): Promise<SessionPreview>;
}
