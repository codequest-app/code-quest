import type { RawEntry } from '@code-quest/summoner';

export interface RawEventStore {
  append(entry: RawEntry): Promise<void>;
  getBySession(sessionId: string): Promise<RawEntry[]>;
}
