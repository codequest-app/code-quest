import { logger } from '../logger.ts';
import type { RawEventStore } from '../services/raw-event-store.ts';
import type { Channel } from './channel.ts';

export class RawRecorder {
  constructor(private rawEventStore: RawEventStore) {}

  wire(channel: Channel): void {
    const { runner } = channel;
    let seqCounter = 0;
    const pendingRawEntries: Array<{
      raw: string;
      direction: 'in' | 'out' | 'err';
      timestamp: number;
      seq: number;
    }> = [];

    const flushPending = (sessionId: string) => {
      for (const pending of pendingRawEntries) {
        this.rawEventStore
          .append({ ...pending, sessionId, promptId: '' })
          .catch((err) => logger.error({ err }, 'Failed to persist buffered raw event'));
      }
      pendingRawEntries.length = 0;
    };

    const recordRaw = (raw: string, direction: 'in' | 'out' | 'err') => {
      const sessionId = channel.sessionId;
      if (!sessionId) {
        pendingRawEntries.push({ raw, direction, timestamp: Date.now(), seq: seqCounter++ });
        return;
      }
      if (pendingRawEntries.length > 0) flushPending(sessionId);
      this.rawEventStore
        .append({
          timestamp: Date.now(),
          sessionId,
          promptId: '',
          raw,
          direction,
          seq: seqCounter++,
        })
        .catch((err) => logger.error({ err }, 'Failed to persist raw event'));
    };

    runner.on('stdout', (line: string) => recordRaw(line, 'out'));
    runner.on('stdin', (raw: string) => recordRaw(raw, 'in'));
    runner.on('stderr', (line: string) => {
      recordRaw(line, 'err');
      channel.lastError = line;
    });
  }
}
