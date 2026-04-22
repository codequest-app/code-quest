import { logger } from '../logger.ts';
import type { RawEventService } from '../services/raw-event-service.ts';
import type { Channel } from './channel.ts';
import { isDelta } from './raw-classifier.ts';

interface PendingEvent {
  raw: string;
  direction: 'in' | 'out' | 'err';
  timestamp: number;
  seq: number;
}

/** `true` when the raw line is a stdin user message (the start of a turn). */
function isUserStdin(raw: string, direction: 'in' | 'out' | 'err'): boolean {
  if (direction !== 'in') return false;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return false;
    return (parsed as { type?: unknown }).type === 'user';
  } catch {
    return false;
  }
}

export class RawRecorder {
  constructor(
    private service: RawEventService,
    private persistDeltas: boolean,
  ) {}

  wire(channel: Channel): void {
    const { runner } = channel;
    let seqCounter = 0;
    let currentTurnRootId: string | null = null;
    const pendingEvents: PendingEvent[] = [];

    const persistOne = async (pending: PendingEvent, sessionId: string): Promise<void> => {
      // Delta path — dropped entirely if opt-out.
      if (isDelta(pending.raw)) {
        if (!this.persistDeltas) return;
        await this.service.appendDelta({
          parentId: currentTurnRootId ?? '',
          sessionId,
          direction: pending.direction,
          raw: pending.raw,
          seq: pending.seq,
          timestamp: pending.timestamp,
        });
        return;
      }

      // Non-delta — hits raw_events. If it's a user stdin, remember its id
      // as the turn root so subsequent deltas attribute to it.
      const id = await this.service.appendEvent({
        sessionId,
        direction: pending.direction,
        raw: pending.raw,
        seq: pending.seq,
        timestamp: pending.timestamp,
      });
      if (isUserStdin(pending.raw, pending.direction)) {
        currentTurnRootId = id;
      }
    };

    const flushPending = async (sessionId: string): Promise<void> => {
      for (const pending of pendingEvents) {
        try {
          await persistOne(pending, sessionId);
        } catch (err) {
          logger.error({ err }, 'Failed to persist buffered raw event');
        }
      }
      pendingEvents.length = 0;
    };

    const recordRaw = (raw: string, direction: 'in' | 'out' | 'err'): void => {
      const sessionId = channel.sessionId;
      if (!sessionId) {
        pendingEvents.push({ raw, direction, timestamp: Date.now(), seq: seqCounter++ });
        return;
      }
      if (pendingEvents.length > 0) void flushPending(sessionId);
      void persistOne(
        { raw, direction, timestamp: Date.now(), seq: seqCounter++ },
        sessionId,
      ).catch((err) => logger.error({ err }, 'Failed to persist raw event'));
    };

    runner.on('stdout', (line: string) => recordRaw(line, 'out'));
    runner.on('stdin', (raw: string) => recordRaw(raw, 'in'));
    runner.on('stderr', (line: string) => {
      recordRaw(line, 'err');
      channel.lastError = line;
    });
  }
}
