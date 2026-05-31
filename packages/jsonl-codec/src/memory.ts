import type { JsonlSessionRecord } from './decoder.ts';
import type { SessionData, SessionSink, SessionSource } from './types.ts';

const EMPTY_RECORD: JsonlSessionRecord = {
  id: '',
  channelId: '',
  provider: 'claude',
  command: 'claude',
  args: '[]',
  cwd: '',
  projectRoot: '',
  mode: 'interactive',
  role: 'chat',
  createdAt: '',
};

export class MemoryReader implements SessionSource {
  private readonly data: Map<string, SessionData>;
  constructor(data: Map<string, SessionData>) {
    this.data = data;
  }

  async read(sessionId: string): Promise<SessionData> {
    return this.data.get(sessionId) ?? { events: [], record: { ...EMPTY_RECORD, id: sessionId } };
  }
}

export class MemoryWriter implements SessionSink {
  readonly data = new Map<string, SessionData>();

  async write(sessionId: string, data: SessionData): Promise<void> {
    this.data.set(sessionId, data);
  }
}
