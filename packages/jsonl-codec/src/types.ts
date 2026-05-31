import type { RawEvent } from '@code-quest/summoner';
import type { JsonlSessionRecord } from './decoder.ts';

export type { JsonlSessionRecord };

export interface SessionData {
  events: RawEvent[];
  record: JsonlSessionRecord;
}

export interface SessionSource {
  read(sessionId: string): Promise<SessionData>;
}

export interface SessionSink {
  write(sessionId: string, data: SessionData): Promise<void>;
}
