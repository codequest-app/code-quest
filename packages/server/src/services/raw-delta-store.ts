export interface RawDeltaEntry {
  parentId: string;
  sessionId: string;
  direction: 'in' | 'out' | 'err';
  raw: string;
  seq: number;
  timestamp: number;
}

export interface RawDeltaStore {
  append(event: RawDeltaEntry): Promise<void>;
  getBySession(sessionId: string): Promise<RawDeltaEntry[]>;
}
